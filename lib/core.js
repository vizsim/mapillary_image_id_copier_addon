/**
 * Kernlogik der Erweiterung: Erkennung, Kombination, Zwischenablage-Text und Mapillary-Filter.
 * Ohne chrome.*-APIs, damit Popup und Einstellungsseite sie teilen und tests/ sie prüfen kann.
 */

export const MAPILLARY_DOMAIN = 'mapillary.com';
export const TRAFFIC_SIGN_TOOL_BASE_URL = 'https://trafficsigns.osm-verkehrswende.org/DE?signs=';

/**
 * Sprite-Sheet von Mapillary
 *
 * Mapillary zeigt die Verkehrszeichen im Viewer als Ausschnitte (CSS `clip`) aus einem
 * gemeinsamen Sprite-Sheet. Die JSON-Datei daneben enthält für jedes Zeichen die Position:
 *
 *   "regulatory--bicycles-only--g1": { "x": 696, "y": 408, "width": 24, "height": 24, ... }
 *
 * Der clip-Wert im DOM ist dann rect(y, x + width, y + height, x). Mapillary ordnet das
 * Sprite-Sheet immer wieder neu an (z. B. Dezember 2025 und Oktober 2026). Deshalb stehen keine
 * Positionen im Code: Sie werden zur Laufzeit aus der JSON gelesen (der Browser cached sie gemäß
 * den Cache-Headern des Servers). Der Katalog arbeitet nur mit den stabilen Mapillary-Namen.
 */
const SPRITE_BASE_URL = 'https://external.xx.fbcdn.net/maps/vt/sprites/mapillary_sprites';
export const SPRITE_INDEX_URL = `${SPRITE_BASE_URL}.json`;
export const SPRITE_IMAGE_URL = `${SPRITE_BASE_URL}.png`;

// Mapillary-Kategorien, die Verkehrszeichen sind (andere Sprites sind z. B. Markierungen oder POIs)
const SIGN_CATEGORIES = ['regulatory', 'warning', 'information', 'complementary'];

// URL-Parameter des Verkehrszeichen-Filters in Mapillary: trafficSign=all oder trafficSign[]=<Name>
const FILTER_PARAM = 'trafficSign';
const FILTER_LIST_PARAM = 'trafficSign[]';

/**
 * Prüft, ob die URL zu Mapillary gehört (mapillary.com oder eine Subdomain davon)
 * @param {string} url
 * @returns {boolean}
 */
export function isMapillaryUrl(url) {
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
 * @param {string} url
 * @returns {string|null} - Die führenden Ziffern des pKey-Werts oder null
 * @example
 * extractPkey("https://www.mapillary.com/app/?pKey=12345")  // "12345"
 * extractPkey("https://www.mapillary.com/app/?pKey=abc123") // null
 */
export function extractPkey(url) {
  try {
    const pkeyRaw = new URL(url).searchParams.get('pKey');
    const match = pkeyRaw ? pkeyRaw.match(/^\d+/) : null;
    return match ? match[0] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Ist der Mapillary-Name ein Verkehrszeichen (und z. B. keine Markierung)?
 * @param {string} name - z. B. "regulatory--no-entry--g1"
 */
export function isTrafficSignName(name) {
  return SIGN_CATEGORIES.includes(String(name).split('--')[0]);
}

/**
 * Zusatzzeichen sind die Zeichen der Mapillary-Kategorie "complementary"
 * @param {string} name
 */
export function isSupplementary(name) {
  return String(name).startsWith('complementary--');
}

/**
 * Parst einen CSS clip-Wert wie "rect(408px, 720px, 432px, 696px)"
 * (Reihenfolge: oben, rechts, unten, links; Komma oder Leerzeichen als Trenner)
 *
 * @param {string} clip
 * @returns {{x: number, y: number, width: number, height: number}|null}
 */
export function parseClipRect(clip) {
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
 */
export function spriteKey({ x, y, width, height }) {
  return [x, y, width, height].map(Math.round).join(',');
}

/**
 * @param {Object<string, {x: number, y: number, width: number, height: number}>} sprites - Inhalt der Sprite-JSON
 * @returns {{sprites: Object, nameByPosition: Map<string, string>}}
 */
export function buildSpriteIndex(sprites) {
  const nameByPosition = new Map();
  for (const [name, sprite] of Object.entries(sprites)) {
    nameByPosition.set(spriteKey(sprite), name);
  }
  return { sprites, nameByPosition };
}

/**
 * Lädt die Index-Datei des Sprite-Sheets
 * @param {typeof fetch} fetchImpl
 */
export async function loadSpriteIndex(fetchImpl = fetch) {
  const response = await fetchImpl(SPRITE_INDEX_URL);
  if (!response.ok) {
    throw new Error(`Sprite-Index: HTTP ${response.status}`);
  }
  return buildSpriteIndex(await response.json());
}

/**
 * Ordnet die clip-Werte der Symbole im Viewer Mapillary-Namen zu
 *
 * @param {string[]} clips
 * @param {Map<string, string>} nameByPosition
 * @returns {{names: string[], unknownClips: string[]}} - Namen ohne Duplikate, in DOM-Reihenfolge
 */
export function resolveSpriteNames(clips, nameByPosition) {
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
  return { names: [...names], unknownClips };
}

/**
 * Gleicht erkannte Mapillary-Namen mit den aktiven Zuordnungen ab
 *
 * @param {string[]} names
 * @param {Array<{mapillary: string, code: string}>} mapping - aktive Zuordnungen (siehe catalog.js)
 * @returns {{matched: Array, unmapped: string[]}} - matched in der Reihenfolge der Zuordnungen,
 *   unmapped = erkannte Verkehrszeichen ohne Zuordnung
 */
export function matchSigns(names, mapping) {
  const found = new Set(names);
  const mapped = new Set(mapping.map((entry) => entry.mapillary));
  return {
    matched: mapping.filter((entry) => found.has(entry.mapillary)),
    unmapped: [...found].filter((name) => !mapped.has(name) && isTrafficSignName(name))
  };
}

/**
 * Baut den traffic_sign-Wert: erst die Hauptzeichen, dann die Zusatzzeichen, jeweils in der
 * Reihenfolge der Einträge. Das Länderpräfix steht je Land nur einmal, doppelte Codes entfallen.
 *
 * @param {Array<{mapillary: string, code: string}>} entries
 * @returns {string} - z. B. "DE:239,1022-10,1000-31", oder "" ohne Einträge
 */
export function composeTrafficSign(entries) {
  const ordered = [
    ...entries.filter((entry) => !isSupplementary(entry.mapillary)),
    ...entries.filter((entry) => isSupplementary(entry.mapillary))
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
 * Baut den Text für die Zwischenablage. Ohne Verkehrszeichen entfallen
 * traffic_sign und traffic_sign:direction.
 *
 * @param {string} imageId
 * @param {string} trafficSign - traffic_sign-Wert oder ""
 * @param {{includeMapillary: boolean, includeTrafficSign: boolean, includeDirection: boolean, direction: string}} settings
 * @returns {string} - Zeilen mit Zeilenumbruch getrennt, ggf. leer
 */
export function buildClipboardText(imageId, trafficSign, settings) {
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
 * Normalisiert einen eingegebenen OSM-Code: "267" → "DE:267", "de:1022-10" → "DE:1022-10"
 *
 * @param {string} input
 * @param {string} defaultCountry
 * @returns {string|null} - null, wenn die Eingabe kein einzelner Code ist (z. B. leer oder mit Komma)
 */
export function normalizeSignCode(input, defaultCountry = 'DE') {
  const value = String(input ?? '').replace(/\s+/g, '');
  const match = /^(?:([A-Za-z]{2}):)?([0-9A-Za-z][0-9A-Za-z._[\]-]*)$/.exec(value);
  if (!match) {
    return null;
  }
  return `${(match[1] || defaultCountry).toUpperCase()}:${match[2]}`;
}

/**
 * @param {string} trafficSign - z. B. "DE:240,1000-31"
 */
export function trafficSignToolUrl(trafficSign) {
  return `${TRAFFIC_SIGN_TOOL_BASE_URL}${encodeURIComponent(trafficSign)}`;
}

/**
 * Welche Verkehrszeichen blendet Mapillary laut URL ein?
 * @param {string} url
 * @returns {{all: boolean, names: Set<string>}}
 */
export function shownTrafficSigns(url) {
  const params = new URL(url).searchParams;
  const single = params.getAll(FILTER_PARAM);
  return {
    all: single.includes('all'),
    names: new Set([...params.getAll(FILTER_LIST_PARAM), ...single.filter((value) => value !== 'all')])
  };
}

/**
 * Mapillary-Namen, die laut URL nicht eingeblendet sind
 * @param {string} url
 * @param {string[]} names
 * @returns {string[]}
 */
export function missingTrafficSigns(url, names) {
  const shown = shownTrafficSigns(url);
  if (shown.all) {
    return [];
  }
  return [...new Set(names)].filter((name) => !shown.names.has(name));
}

/**
 * Ergänzt fehlende Zeichen im Filter; alle anderen Parameter (pKey, Position, ...) bleiben
 * @param {string} url
 * @param {string[]} names
 * @returns {string}
 */
export function withTrafficSigns(url, names) {
  const result = new URL(url);
  for (const name of missingTrafficSigns(url, names)) {
    result.searchParams.append(FILTER_LIST_PARAM, name);
  }
  return result.toString();
}

/**
 * Setzt den Filter auf genau diese Zeichen
 * @param {string} url
 * @param {string[]} names
 * @returns {string}
 */
export function withOnlyTrafficSigns(url, names) {
  const result = new URL(url);
  result.searchParams.delete(FILTER_PARAM);
  result.searchParams.delete(FILTER_LIST_PARAM);
  for (const name of new Set(names)) {
    result.searchParams.append(FILTER_LIST_PARAM, name);
  }
  return result.toString();
}

/**
 * Blendet alle Verkehrszeichen ein (trafficSign=all)
 * @param {string} url
 * @returns {string}
 */
export function withAllTrafficSigns(url) {
  const result = new URL(url);
  result.searchParams.delete(FILTER_LIST_PARAM);
  result.searchParams.set(FILTER_PARAM, 'all');
  return result.toString();
}

/**
 * Läuft im Tab (chrome.scripting.executeScript): liest die clip-Werte aller
 * Verkehrszeichen-Symbole im Mapillary-Viewer. Darf nichts von außerhalb verwenden.
 *
 * @returns {string[]} - z. B. ["rect(408px, 720px, 432px, 696px)"]
 */
export function collectSignClips() {
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
