// Konstanten
const BADGE_DISPLAY_DURATION = 2000; // Anzeigedauer für Badges in Millisekunden
const BADGE_COLORS = {
  ERROR: '#ff0000',
  SUCCESS: '#00ff00',
  WARNING: '#ffaa00'
};
const MAPILLARY_DOMAIN = 'mapillary.com';
const TRAFFIC_SIGN_TOOL_BASE_URL = 'https://trafficsigns.osm-verkehrswende.org/DE?signs=';

/**
 * Sprite-Sheet URL für Mapillary Verkehrszeichen
 * 
 * Die offizielle Sprite-Sheet-URL, die von Mapillary verwendet wird.
 * Diese URL kann sich ändern, wenn Mapillary das Sprite-Sheet aktualisiert.
 * 
 * @see https://external.xx.fbcdn.net/maps/vt/sprites/mapillary_sprites.png
 * @see Web Archive zur Nachverfolgung von Änderungen (siehe README)
 */
const MAPILLARY_SPRITE_SHEET_URL = 'https://external.xx.fbcdn.net/maps/vt/sprites/mapillary_sprites.png';

/**
 * Mapping von clip CSS-Werten zu Verkehrszeichen-Codes
 * 
 * Jedes Verkehrszeichen wird durch eine spezifische clip-Eigenschaft identifiziert,
 * die die Position im Sprite-Sheet angibt. Die Werte können sich ändern, wenn
 * Mapillary das Sprite-Sheet aktualisiert.
 * 
 * Format: rect(top, right, bottom, left)
 * 
 * @type {Array<{code: string, name: string, clips: string[], description: string}>}
 */
const TRAFFIC_SIGN_MAPPING = [
  {
    code: 'DE:240',
    name: 'Gemeinsamer Geh- und Radweg',
    description: 'shared path pedestrians and bicycles (g1)',
    clips: [
      // 'rect(0px, 576px, 24px, 552px)',   // Alte Version (auskommentiert - könnte jetzt falsches Icon sein)
      'rect(0px, 624px, 24px, 600px)'    // Neue Version (Dezember 2025)
    ]
  },
  {
    code: 'DE:237',
    name: 'Radweg',
    description: 'Regulatory: Bicycles only (g1)',
    clips: [
      // 'rect(360px, 648px, 384px, 624px)',   // Alte Version (auskommentiert - könnte jetzt falsches Icon sein)
      'rect(360px, 528px, 384px, 504px)'    // Neue Version (Dezember 2025)
    ]
  },
  {
    code: 'DE:241-30',
    name: 'Getrennter Rad- und Gehweg (Radweg links)',
    description: 'Regulatory: Dual path bicycles and pedestrians (g1)',
    clips: [
      // 'rect(24px, 1863px, 48px, 1839px)',   // Alte Version (auskommentiert - könnte jetzt falsches Icon sein)
      'rect(72px, 1120px, 96px, 1096px)'    // Neue Version (Dezember 2025)
    ]
  },
  {
    code: 'DE:241-31',
    name: 'Getrennter Rad- und Gehweg (Radweg rechts)',
    description: 'Regulatory: Dual path pedestrians and bicycles (g1)',
    clips: [
      // 'rect(922px, 108px, 946px, 84px)',   // Alte Version (auskommentiert - könnte jetzt falsches Icon sein)
      'rect(954px, 324px, 978px, 300px)'    // Neue Version (Dezember 2025)
    ]
  },
  {
    code: 'DE:239',
    name: 'Gehweg',
    description: 'Regulatory: Pedestrians only (g1)',
    clips: [
      // 'rect(624px, 870px, 648px, 846px)',   // Alte Version (auskommentiert - könnte jetzt falsches Icon sein)
      'rect(688px, 168px, 712px, 144px)'     // Neue Version (Dezember 2025)
    ]
  },
  {
    code: 'DE:1022-10',
    name: 'Radfahrer frei',
    description: 'Complementary: Except bicycles (g1)',
    clips: [
      // 'rect(982px, 960px, 1006px, 936px)',   // Alte Version (auskommentiert - könnte jetzt falsches Icon sein)
      'rect(24px, 1263px, 48px, 1239px)'     // Neue Version (Dezember 2025)
    ]
  },
  {
    code: 'DE:1000-31',
    name: 'Beide Richtungen',
    description: 'Complementary: Two way traffic (g3)',
    clips: [
      'rect(264px, 888px, 288px, 864px)'     // Neue Version (Dezember 2025)
    ]
  }
];

/**
 * Zeigt ein Badge am Extension-Icon an
 * @param {number|undefined} tabId - Die Tab-ID
 * @param {string} text - Der Badge-Text
 * @param {string} color - Die Badge-Farbe (z.B. "#ff0000")
 * @param {number} duration - Anzeigedauer in Millisekunden
 */
async function showBadge(tabId, text, color, duration = BADGE_DISPLAY_DURATION) {
  try {
    // Prüfe ob tabId gültig ist
    if (tabId === undefined || tabId === null) {
      // Fallback: Badge für alle Tabs setzen
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, duration);
      return;
    }

    // Prüfe ob Tab noch existiert
    try {
      await chrome.tabs.get(tabId);
    } catch (e) {
      // Tab existiert nicht mehr - verwende Fallback
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, duration);
      return;
    }

    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId }).catch(() => {
        // Ignoriere Fehler beim Entfernen des Badges
      });
    }, duration);
  } catch (err) {
    // Fehler beim Setzen des Badges - logge aber nicht, um Spam zu vermeiden
    console.debug('Fehler beim Setzen des Badges:', err);
  }
}

/**
 * Prüft, ob die aktuelle URL eine Mapillary-URL ist
 * @param {string} url - Die zu prüfende URL
 * @returns {boolean} - true wenn es eine Mapillary-URL ist
 */
function isMapillaryUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes(MAPILLARY_DOMAIN);
  } catch (e) {
    return false;
  }
}

/**
 * Service Worker Initialisierung
 * Stellt sicher, dass der Service Worker korrekt geladen ist
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Add-on: Service Worker initialisiert');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Add-on: Service Worker gestartet');
});

/**
 * Hauptfunktion: Reagiert auf Klick auf das Add-on-Icon
 * Extrahiert Mapillary Image ID und Verkehrszeichen, kopiert sie in die Zwischenablage
 * und öffnet das OSM Traffic Sign Tool
 */
chrome.action.onClicked.addListener(async (tab) => {
    try {
      // Prüfe ob Tab und URL vorhanden sind
      if (!tab || !tab.url) {
        await showBadge(tab?.id, "!", BADGE_COLORS.ERROR);
        console.warn('Add-on: Tab oder URL fehlt', { tab: tab?.id, url: tab?.url });
        return;
      }

      // Prüfe ob es eine Mapillary-URL ist
      if (!isMapillaryUrl(tab.url)) {
        await showBadge(tab.id, "!", BADGE_COLORS.ERROR);
        console.warn('Add-on: Keine Mapillary-URL', { url: tab.url });
        return;
      }
  
      const url = tab.url;
      const pkeyValue = extractPkey(url);
  
      if (!pkeyValue) {
        await showBadge(tab.id, "!", BADGE_COLORS.ERROR);
        console.warn('Add-on: pkey nicht gefunden', { url: tab.url });
        return;
      }

      // Verkehrszeichen-Typ aus dem DOM ermitteln
      // Übergib das Mapping als Argument, da detectTrafficSign im Tab-Kontext läuft
      let trafficSignResult;
      try {
        trafficSignResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: detectTrafficSign,
          args: [TRAFFIC_SIGN_MAPPING]
        });
      } catch (scriptError) {
        // Tab könnte geschlossen worden sein oder Seite nicht erreichbar
        console.error('Add-on: Fehler beim Ausführen des Scripts', scriptError);
        await showBadge(tab.id, "!", BADGE_COLORS.ERROR);
        return;
      }

      // Der Rückgabewert ist ein Array von InjectionResult Objekten
      // Jedes Objekt hat eine 'result' Property mit dem tatsächlichen Rückgabewert
      let trafficSign = '';
      if (trafficSignResult && Array.isArray(trafficSignResult) && trafficSignResult.length > 0) {
        const result = trafficSignResult[0].result;
        
        // Neues Format: { trafficSign: string, unknownClips: string[] }
        if (result && typeof result === 'object' && 'trafficSign' in result) {
          trafficSign = result.trafficSign || '';
          // Unbekannte clip-Werte werden in der Konsole geloggt (für Entwickler)
        } else if (typeof result === 'string') {
          // Altes Format (für Rückwärtskompatibilität)
          trafficSign = result;
        } else if (result !== null && result !== undefined) {
          trafficSign = String(result);
        }
      }

      // Format: Text basierend auf Einstellungen
      const formatSettings = await chrome.storage.local.get([
        'includeMapillary', 
        'includeTrafficSign', 
        'includeDirection',
        'direction'
      ]);
      
      const includeMapillary = formatSettings.includeMapillary !== undefined 
        ? formatSettings.includeMapillary 
        : true;
      const includeTrafficSign = formatSettings.includeTrafficSign !== undefined 
        ? formatSettings.includeTrafficSign 
        : true;
      const includeDirection = formatSettings.includeDirection !== undefined 
        ? formatSettings.includeDirection 
        : true;
      const direction = formatSettings.direction !== undefined 
        ? formatSettings.direction 
        : 'forward';
      
      const parts = [];
      
      if (includeMapillary) {
        parts.push(`mapillary=${pkeyValue}`);
      }
      if (includeTrafficSign) {
        parts.push(`traffic_sign=${trafficSign}`);
      }
      if (includeDirection) {
        parts.push(`traffic_sign:direction=${direction}`);
      }
      
      // Immer Zeilenumbrüche verwenden
      const formattedValue = parts.join('\n');

      // In Zwischenablage kopieren über Content Script
      // (Service Worker kann nicht direkt auf Clipboard zugreifen)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: copyToClipboard,
          args: [formattedValue]
        });
      } catch (clipboardError) {
        console.error('Add-on: Fehler beim Kopieren in Zwischenablage', clipboardError);
        // Versuche trotzdem fortzufahren - Tab könnte noch geöffnet werden
      }
  
      // Öffne neuen Tab mit Traffic Sign Tool URL im Hintergrund, falls ein Verkehrszeichen gefunden wurde
      // Nur wenn die Option aktiviert ist
      if (trafficSign) {
        const settings = await chrome.storage.local.get(['autoOpenTab']);
        const shouldOpenTab = settings.autoOpenTab !== undefined ? settings.autoOpenTab : true; // Standard: true
        
        if (shouldOpenTab) {
          const trafficSignUrl = `${TRAFFIC_SIGN_TOOL_BASE_URL}${encodeURIComponent(trafficSign)}`;
          chrome.tabs.create({ 
            url: trafficSignUrl, 
            active: false,
            index: tab.index + 1  // Direkt nach dem aktuellen Tab
          });
        }
      }
  
      // Erfolgs-Feedback
      await showBadge(tab.id, "✓", BADGE_COLORS.SUCCESS);
  
    } catch (err) {
      // Logge Fehler für Debugging
      console.error('Add-on: Unerwarteter Fehler', err);
      await showBadge(tab?.id, "✗", BADGE_COLORS.ERROR);
    }
  });
  
  /**
   * Funktion, die im Tab-Kontext ausgeführt wird, um das Verkehrszeichen zu erkennen
   * Identifiziert Verkehrszeichen über die clip CSS-Eigenschaft der Bilder
   * 
   * @param {Array} trafficSignMapping - Das Mapping von clip-Werten zu Verkehrszeichen-Codes
   * @returns {string} - Der Verkehrszeichen-Code (z.B. "DE:240") oder leerer String wenn nichts gefunden wurde
   */
  function detectTrafficSign(trafficSignMapping) {
    /**
     * Prüft, ob ein clip-Wert zu einem Verkehrszeichen passt
     * @param {string} clip - Der clip CSS-Wert
     * @param {string[]} clips - Array von erwarteten clip-Werten
     * @returns {boolean}
     */
    function matchesClip(clip, clips) {
      // Normalisiere clip-Wert (entferne Leerzeichen) für Vergleich
      // CSS-Werte können theoretisch mit/ohne Leerzeichen sein, aber wir normalisieren für konsistenten Vergleich
      const normalizedClip = clip.replace(/\s+/g, '');
      
      // Prüfe gegen alle erwarteten clip-Werte (auch normalisiert)
      for (const expectedClip of clips) {
        // Überspringe auskommentierte Werte (sollten nicht vorkommen, aber sicherheitshalber)
        if (typeof expectedClip !== 'string') continue;
        
        const normalizedExpected = expectedClip.replace(/\s+/g, '');
        
        // Exakte Übereinstimmung nach Normalisierung
        if (normalizedClip === normalizedExpected) {
          return true;
        }
      }
      
      return false;
    }

    try {
      const imgs = document.querySelectorAll('.mapillary-tag-symbol img');
      const foundSigns = new Set(); // Sammle alle gefundenen Verkehrszeichen

      for (const img of imgs) {
        // Lese clip-Eigenschaft - versuche verschiedene Methoden
        let clip = '';
        
        // Methode 1: Aus dem style-Attribut parsen (meist zuverlässigste Methode)
        if (img.getAttribute('style')) {
          const styleAttr = img.getAttribute('style');
          const clipMatch = styleAttr.match(/clip:\s*([^;]+)/);
          if (clipMatch) {
            clip = clipMatch[1].trim();
          }
        }
        
        // Methode 2: Direkt aus style.clip
        if (!clip && img.style && img.style.clip) {
          clip = img.style.clip;
        }
        
        // Methode 3: getPropertyValue
        if (!clip && img.style) {
          clip = img.style.getPropertyValue('clip');
        }
        
        // Normalisiere den Wert
        if (clip && clip !== 'auto' && clip !== 'none') {
          clip = clip.trim();
          
          // Durchsuche alle Verkehrszeichen-Mappings
          for (const sign of trafficSignMapping) {
            if (matchesClip(clip, sign.clips)) {
              foundSigns.add(sign.code);
              break; // Gefunden, weiter zum nächsten Bild
            }
          }
          
          // Logge unbekannte clip-Werte in die Konsole (für Entwickler)
          const isKnown = trafficSignMapping.some(sign => matchesClip(clip, sign.clips));
          if (!isKnown) {
            console.log('Unbekannter clip-Wert gefunden:', clip);
          }
        }
      }

      // Prüfe spezielle Kombinationen: Hauptschild + Zusatzschild
      // Dreierkombination zuerst prüfen (spezifischer)
      if (foundSigns.has('DE:239') && foundSigns.has('DE:1022-10') && foundSigns.has('DE:1000-31')) {
        return 'DE:239,1022-10,1000-31';
      }
      // Zweierkombinationen
      if (foundSigns.has('DE:239') && foundSigns.has('DE:1022-10')) {
        return 'DE:239,1022-10';
      }
      if (foundSigns.has('DE:237') && foundSigns.has('DE:1000-31')) {
        return 'DE:237,1000-31';
      }
      if (foundSigns.has('DE:240') && foundSigns.has('DE:1000-31')) {
        return 'DE:240,1000-31';
      }
      if (foundSigns.has('DE:241-30') && foundSigns.has('DE:1000-31')) {
        return 'DE:241-30,1000-31';
      }
      if (foundSigns.has('DE:241-31') && foundSigns.has('DE:1000-31')) {
        return 'DE:241-31,1000-31';
      }

      // Falls nur ein Verkehrszeichen gefunden wurde, gebe es zurück
      if (foundSigns.size === 1) {
        return Array.from(foundSigns)[0];
      }

      // Falls mehrere gefunden wurden (aber nicht die spezielle Kombination), gebe das erste zurück
      if (foundSigns.size > 1) {
        return Array.from(foundSigns)[0];
      }

    } catch (e) {
      // Fehler beim Erkennen - gebe leeren String zurück
      console.error('Fehler bei Verkehrszeichen-Erkennung:', e);
    }

    return '';
  }

  /**
   * Funktion, die im Tab-Kontext ausgeführt wird, um in die Zwischenablage zu kopieren
   * 
   * @param {string} text - Der zu kopierende Text
   */
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fehler beim Kopieren - wird ignoriert
    });
  }
  
  /**
   * Extrahiert den Wert hinter pkey= aus einer Mapillary-URL
   * 
   * @param {string} url - Die Mapillary-URL
   * @returns {string|null} - Der pkey-Wert (nur Ziffern) oder null wenn nicht gefunden
   * @example
   * extractPkey("https://mapillary.com/app/?pKey=12345") // returns "12345"
   * extractPkey("https://mapillary.com/app/?pKey=abc123") // returns "123"
   */
  function extractPkey(url) {
    try {
      const u = new URL(url);
      const params = u.searchParams;
      const pkeyRaw = params.get("pKey");
  
      if (!pkeyRaw) {
        return null;
      }
  
      // Nur Ziffern erlauben
      const match = pkeyRaw.match(/^\d+/);
      return match ? match[0] : null;
    } catch (e) {
      return null;
    }
  }