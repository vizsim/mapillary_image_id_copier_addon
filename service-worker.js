// Konstanten
const BADGE_DISPLAY_DURATION = 2000; // Anzeigedauer für Badges in Millisekunden
const BADGE_COLORS = {
  ERROR: '#ff0000',
  SUCCESS: '#00ff00',
  WARNING: '#ffaa00'
};
const MAPILLARY_DOMAIN = 'mapillary.com';
const TRAFFIC_SIGN_TOOL_BASE_URL = 'https://trafficsigns.osm-verkehrswende.org/DE?signs=';

// Standard-Einstellungen (dieselben Werte wie DEFAULT_SETTINGS in options.js)
const DEFAULT_SETTINGS = {
  autoOpenTab: true,
  includeMapillary: true,
  includeTrafficSign: true,
  includeDirection: true,
  direction: 'forward' // 'forward' oder 'backward'
};

/**
 * Index-Datei des Mapillary Sprite-Sheets
 *
 * Mapillary zeigt die Verkehrszeichen im Viewer als Ausschnitte (CSS `clip`) aus einem
 * gemeinsamen Sprite-Sheet (mapillary_sprites.png). Die JSON-Datei daneben enthält für
 * jedes Zeichen die Position im Sprite-Sheet, z. B.:
 *
 *   "regulatory--bicycles-only--g1": { "x": 696, "y": 408, "width": 24, "height": 24, "pixelRatio": 1 }
 *
 * Der clip-Wert im DOM ist dann rect(y, x + width, y + height, x).
 *
 * Mapillary ordnet das Sprite-Sheet immer wieder neu an (z. B. Dezember 2025 und Oktober 2026).
 * Deshalb stehen keine Positionen im Code: Sie werden bei jedem Klick aus dieser Datei gelesen
 * (der Browser cached sie gemäß den Cache-Headern des Servers, derzeit 15 Minuten).
 * TRAFFIC_SIGN_MAPPING arbeitet nur mit den Mapillary-Namen, und die bleiben stabil.
 */
const SPRITE_INDEX_URL = 'https://external.xx.fbcdn.net/maps/vt/sprites/mapillary_sprites.json';

/**
 * Zuordnung von Mapillary-Zeichen zu OSM traffic_sign-Codes
 *
 * Zeichen der Mapillary-Kategorie "complementary" gelten als Zusatzzeichen und stehen
 * im traffic_sign-Wert hinter den Hauptzeichen. Innerhalb dieser beiden Gruppen
 * bestimmt die Reihenfolge hier die Reihenfolge im Ergebnis.
 *
 * @type {Array<{mapillary: string, code: string, name: string}>}
 */
const TRAFFIC_SIGN_MAPPING = [
  { mapillary: 'regulatory--shared-path-pedestrians-and-bicycles--g1', code: 'DE:240', name: 'Gemeinsamer Geh- und Radweg' },
  { mapillary: 'regulatory--bicycles-only--g1', code: 'DE:237', name: 'Radweg' },
  { mapillary: 'regulatory--dual-path-bicycles-and-pedestrians--g1', code: 'DE:241-30', name: 'Getrennter Rad- und Gehweg (Radweg links)' },
  { mapillary: 'regulatory--dual-path-pedestrians-and-bicycles--g1', code: 'DE:241-31', name: 'Getrennter Rad- und Gehweg (Radweg rechts)' },
  { mapillary: 'regulatory--pedestrians-only--g1', code: 'DE:239', name: 'Gehweg' },
  { mapillary: 'complementary--except-bicycles--g1', code: 'DE:1022-10', name: 'Radfahrer frei' },
  { mapillary: 'complementary--two-way-traffic--g3', code: 'DE:1000-31', name: 'Beide Richtungen' }
];

// Timer zum Ausblenden der Badges, je Tab
const badgeTimers = new Map();

/**
 * Zeigt ein Badge am Extension-Icon an und blendet es nach `duration` wieder aus.
 * Ein neues Badge ersetzt ein noch sichtbares, ohne von dessen Timer gelöscht zu werden.
 * @param {number|undefined} tabId - Die Tab-ID (ohne ID gilt das Badge für alle Tabs)
 * @param {string} text - Der Badge-Text
 * @param {string} color - Die Badge-Farbe (z.B. "#ff0000")
 * @param {number} duration - Anzeigedauer in Millisekunden
 */
function showBadge(tabId, text, color, duration = BADGE_DISPLAY_DURATION) {
  const target = tabId === undefined || tabId === null ? {} : { tabId };
  // Fehler ignorieren, z. B. wenn der Tab inzwischen geschlossen wurde
  const ignoreError = () => {};

  clearTimeout(badgeTimers.get(tabId));
  chrome.action.setBadgeText({ ...target, text }).catch(ignoreError);
  chrome.action.setBadgeBackgroundColor({ ...target, color }).catch(ignoreError);
  badgeTimers.set(tabId, setTimeout(() => {
    badgeTimers.delete(tabId);
    chrome.action.setBadgeText({ ...target, text: '' }).catch(ignoreError);
  }, duration));
}

/**
 * Prüft, ob die URL zu Mapillary gehört (mapillary.com oder eine Subdomain davon)
 * @param {string} url - Die zu prüfende URL
 * @returns {boolean}
 */
function isMapillaryUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === MAPILLARY_DOMAIN || hostname.endsWith(`.${MAPILLARY_DOMAIN}`);
  } catch (e) {
    return false;
  }
}

/**
 * Extrahiert die Bild-ID (Parameter pKey) aus einer Mapillary-URL
 *
 * @param {string} url - Die Mapillary-URL
 * @returns {string|null} - Die führenden Ziffern des pKey-Werts oder null
 * @example
 * extractPkey("https://www.mapillary.com/app/?pKey=12345")  // "12345"
 * extractPkey("https://www.mapillary.com/app/?pKey=abc123") // null
 */
function extractPkey(url) {
  try {
    const pkeyRaw = new URL(url).searchParams.get('pKey');
    const match = pkeyRaw ? pkeyRaw.match(/^\d+/) : null;
    return match ? match[0] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Parst einen CSS clip-Wert wie "rect(408px, 720px, 432px, 696px)"
 * (Reihenfolge: oben, rechts, unten, links; Komma oder Leerzeichen als Trenner)
 *
 * @param {string} clip
 * @returns {{x: number, y: number, width: number, height: number}|null}
 */
function parseClipRect(clip) {
  const inner = /^rect\((.*)\)$/.exec(String(clip).trim());
  const values = inner ? inner[1].split(/[\s,]+/).filter(Boolean).map(parseFloat) : [];
  if (values.length !== 4 || values.some(Number.isNaN)) {
    return null;
  }
  const [top, right, bottom, left] = values;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * Schlüssel für eine Position im Sprite-Sheet, z. B. "696,408,24,24"
 * @param {{x: number, y: number, width: number, height: number}} rect
 * @returns {string}
 */
function spriteKey({ x, y, width, height }) {
  return [x, y, width, height].map(Math.round).join(',');
}

/**
 * Lädt die Index-Datei des Sprite-Sheets und baut daraus eine Zuordnung
 * Position → Mapillary-Name
 * @returns {Promise<Map<string, string>>}
 */
async function loadSpriteIndex() {
  const response = await fetch(SPRITE_INDEX_URL);
  if (!response.ok) {
    throw new Error(`Sprite-Index: HTTP ${response.status}`);
  }
  const sprites = await response.json();
  const nameByPosition = new Map();
  for (const [name, sprite] of Object.entries(sprites)) {
    nameByPosition.set(spriteKey(sprite), name);
  }
  return nameByPosition;
}

/**
 * Baut den traffic_sign-Wert aus erkannten Einträgen von TRAFFIC_SIGN_MAPPING:
 * erst die Hauptzeichen, dann die Zusatzzeichen (Mapillary-Kategorie "complementary").
 * Das Länderpräfix steht je Land nur einmal, doppelte Codes entfallen.
 *
 * @param {Array<{mapillary: string, code: string}>} entries - in der Reihenfolge von TRAFFIC_SIGN_MAPPING
 * @returns {string} - z. B. "DE:239,1022-10,1000-31", oder "" ohne Einträge
 */
function composeTrafficSign(entries) {
  const isSupplementary = (entry) => entry.mapillary.startsWith('complementary--');
  const ordered = [
    ...entries.filter((entry) => !isSupplementary(entry)),
    ...entries.filter(isSupplementary)
  ];

  const signsByCountry = new Map();
  for (const { code } of ordered) {
    const separator = code.indexOf(':');
    const country = code.slice(0, Math.max(separator, 0));
    const sign = code.slice(separator + 1);
    if (!signsByCountry.has(country)) {
      signsByCountry.set(country, new Set());
    }
    signsByCountry.get(country).add(sign);
  }

  return [...signsByCountry]
    .map(([country, signs]) => (country ? `${country}:` : '') + [...signs].join(','))
    .join(';');
}

/**
 * Ermittelt den traffic_sign-Wert für das angezeigte Mapillary-Bild.
 * Details zur Erkennung stehen in der Konsole des Service Workers.
 *
 * @param {number} tabId
 * @returns {Promise<string>} - z. B. "DE:239,1022-10", oder "" wenn kein bekanntes Zeichen erkannt wurde
 */
async function detectTrafficSign(tabId) {
  const [{ result: clips } = {}] = await chrome.scripting.executeScript({
    target: { tabId },
    func: collectSignClips
  });
  if (!Array.isArray(clips) || clips.length === 0) {
    console.info('Add-on: Keine Verkehrszeichen-Symbole gefunden (ist die Verkehrszeichen-Ebene aktiv?)');
    return '';
  }

  let nameByPosition;
  try {
    nameByPosition = await loadSpriteIndex();
  } catch (err) {
    console.error('Add-on: Sprite-Index konnte nicht geladen werden', err);
    return '';
  }

  const names = new Set();
  const unknownClips = [];
  for (const clip of clips) {
    const rect = parseClipRect(clip);
    const name = rect && nameByPosition.get(spriteKey(rect));
    if (name) {
      names.add(name);
    } else {
      unknownClips.push(clip);
    }
  }

  const mappedNames = new Set(TRAFFIC_SIGN_MAPPING.map((entry) => entry.mapillary));
  const matched = TRAFFIC_SIGN_MAPPING.filter((entry) => names.has(entry.mapillary));
  const unmapped = [...names].filter((name) => !mappedNames.has(name));
  const trafficSign = composeTrafficSign(matched);

  console.info('Add-on: Erkennung', { mapillary: [...names], trafficSign, ohneZuordnung: unmapped });
  if (unknownClips.length > 0) {
    console.warn('Add-on: clip-Werte ohne Treffer im Sprite-Index', unknownClips);
  }
  return trafficSign;
}

/**
 * Baut den Text für die Zwischenablage gemäß den Einstellungen.
 * Ohne erkanntes Verkehrszeichen entfallen traffic_sign und traffic_sign:direction.
 *
 * @param {string} imageId - Die Mapillary Bild-ID
 * @param {string} trafficSign - Der traffic_sign-Wert oder ""
 * @param {typeof DEFAULT_SETTINGS} settings
 * @returns {string} - Zeilen mit Zeilenumbruch getrennt, ggf. leer
 */
function buildClipboardText(imageId, trafficSign, settings) {
  const lines = [];
  if (settings.includeMapillary) {
    lines.push(`mapillary=${imageId}`);
  }
  if (trafficSign && settings.includeTrafficSign) {
    lines.push(`traffic_sign=${trafficSign}`);
  }
  if (trafficSign && settings.includeDirection) {
    lines.push(`traffic_sign:direction=${settings.direction}`);
  }
  return lines.join('\n');
}

/**
 * Service Worker Initialisierung
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Add-on: Service Worker initialisiert');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Add-on: Service Worker gestartet');
});

/**
 * Hauptfunktion: Reagiert auf Klick auf das Add-on-Icon.
 * Liest Bild-ID und Verkehrszeichen aus, kopiert sie in die Zwischenablage
 * und öffnet das OSM Traffic Sign Tool.
 *
 * Badges: ✓ Zeichen erkannt und kopiert · ? kein bekanntes Zeichen (nur Bild-ID kopiert)
 *         ! Fehler (keine Mapillary-Bildseite, Kopieren fehlgeschlagen) · ✗ unerwarteter Fehler
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab || !tab.url || !isMapillaryUrl(tab.url)) {
      console.warn('Add-on: Keine Mapillary-Seite', { url: tab?.url });
      showBadge(tab?.id, '!', BADGE_COLORS.ERROR);
      return;
    }

    const imageId = extractPkey(tab.url);
    if (!imageId) {
      console.warn('Add-on: pKey nicht gefunden', { url: tab.url });
      showBadge(tab.id, '!', BADGE_COLORS.ERROR);
      return;
    }

    const trafficSign = await detectTrafficSign(tab.id);
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    const text = buildClipboardText(imageId, trafficSign, settings);

    // In die Zwischenablage kopieren über ein Script im Tab
    // (der Service Worker kann nicht direkt auf die Zwischenablage zugreifen)
    if (text) {
      const [{ result: copied } = {}] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: copyToClipboard,
        args: [text]
      });
      if (!copied?.ok) {
        console.error('Add-on: Kopieren in die Zwischenablage fehlgeschlagen', copied?.error);
        showBadge(tab.id, '!', BADGE_COLORS.ERROR);
        return;
      }
    }

    // Traffic Sign Tool im Hintergrund öffnen, falls ein Verkehrszeichen erkannt wurde
    if (trafficSign && settings.autoOpenTab) {
      await chrome.tabs.create({
        url: `${TRAFFIC_SIGN_TOOL_BASE_URL}${encodeURIComponent(trafficSign)}`,
        active: false,
        index: tab.index + 1 // Direkt nach dem aktuellen Tab
      });
    }

    if (trafficSign) {
      showBadge(tab.id, '✓', BADGE_COLORS.SUCCESS);
    } else {
      showBadge(tab.id, '?', BADGE_COLORS.WARNING);
    }
  } catch (err) {
    console.error('Add-on: Unerwarteter Fehler', err);
    showBadge(tab?.id, '✗', BADGE_COLORS.ERROR);
  }
});

/**
 * Läuft im Tab: liest die clip-Werte aller Verkehrszeichen-Symbole im Mapillary-Viewer
 * @returns {string[]} - z. B. ["rect(408px, 720px, 432px, 696px)"]
 */
function collectSignClips() {
  const clips = [];
  for (const img of document.querySelectorAll('.mapillary-tag-symbol img')) {
    const match = (img.getAttribute('style') || '').match(/(?:^|;)\s*clip\s*:\s*([^;]+)/);
    const clip = (match ? match[1] : img.style.clip || '').trim();
    if (clip && clip !== 'auto') {
      clips.push(clip);
    }
  }
  return clips;
}

/**
 * Läuft im Tab: kopiert Text in die Zwischenablage
 * @param {string} text - Der zu kopierende Text
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
