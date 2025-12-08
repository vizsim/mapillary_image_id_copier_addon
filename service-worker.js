// Konstanten
const BADGE_DISPLAY_DURATION = 2000; // Anzeigedauer für Badges in Millisekunden
const BADGE_COLORS = {
  ERROR: '#ff0000',
  SUCCESS: '#00ff00'
};
const MAPILLARY_DOMAIN = 'mapillary.com';
const TRAFFIC_SIGN_TOOL_BASE_URL = 'https://trafficsigns.osm-verkehrswende.org/DE?signs=';

/**
 * Zeigt ein Badge am Extension-Icon an
 * @param {number} tabId - Die Tab-ID
 * @param {string} text - Der Badge-Text
 * @param {string} color - Die Badge-Farbe (z.B. "#ff0000")
 * @param {number} duration - Anzeigedauer in Millisekunden
 */
function showBadge(tabId, text, color, duration = BADGE_DISPLAY_DURATION) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "", tabId });
  }, duration);
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
 * Hauptfunktion: Reagiert auf Klick auf das Add-on-Icon
 * Extrahiert Mapillary Image ID und Verkehrszeichen, kopiert sie in die Zwischenablage
 * und öffnet das OSM Traffic Sign Tool
 */
chrome.action.onClicked.addListener(async (tab) => {
    try {
      // Prüfe ob Tab und URL vorhanden sind
      if (!tab || !tab.url) {
        showBadge(tab?.id, "!", BADGE_COLORS.ERROR);
        return;
      }

      // Prüfe ob es eine Mapillary-URL ist
      if (!isMapillaryUrl(tab.url)) {
        showBadge(tab.id, "!", BADGE_COLORS.ERROR);
        return;
      }
  
      const url = tab.url;
      const pkeyValue = extractPkey(url);
  
      if (!pkeyValue) {
        showBadge(tab.id, "!", BADGE_COLORS.ERROR);
        return;
      }
  
      // Verkehrszeichen-Typ aus dem DOM ermitteln
      const trafficSignResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: detectTrafficSign
      });

      // Der Rückgabewert ist ein Array von InjectionResult Objekten
      // Jedes Objekt hat eine 'result' Property mit dem tatsächlichen Rückgabewert
      let trafficSign = '';
      if (trafficSignResult && Array.isArray(trafficSignResult) && trafficSignResult.length > 0) {
        const result = trafficSignResult[0].result;
        if (typeof result === 'string') {
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
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: copyToClipboard,
        args: [formattedValue]
      });
  
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
      showBadge(tab.id, "✓", BADGE_COLORS.SUCCESS);
  
    } catch (err) {
      showBadge(tab.id, "✗", BADGE_COLORS.ERROR);
    }
  });
  
  /**
   * Funktion, die im Tab-Kontext ausgeführt wird, um das Verkehrszeichen zu erkennen
   * Identifiziert Verkehrszeichen über die clip CSS-Eigenschaft der Bilder
   * 
   * @returns {string} - Der Verkehrszeichen-Code (z.B. "DE:240") oder leerer String wenn nichts gefunden wurde
   */
  function detectTrafficSign() {
    try {
      const imgs = document.querySelectorAll('.mapillary-tag-symbol img');
      const foundSigns = new Set(); // Sammle alle gefundenen Verkehrszeichen

      for (const img of imgs) {
        // Lese clip-Eigenschaft - versuche verschiedene Methoden
        let clip = '';
        
        // Methode 1: Direkt aus style.clip
        if (img.style && img.style.clip) {
          clip = img.style.clip;
        }
        
        // Methode 2: Aus dem style-Attribut parsen
        if (!clip && img.getAttribute('style')) {
          const styleAttr = img.getAttribute('style');
          const clipMatch = styleAttr.match(/clip:\s*([^;]+)/);
          if (clipMatch) {
            clip = clipMatch[1].trim();
          }
        }
        
        // Methode 3: getPropertyValue
        if (!clip && img.style) {
          clip = img.style.getPropertyValue('clip');
        }
        
        // Normalisiere den Wert
        if (clip && clip !== 'auto' && clip !== 'none') {
          clip = clip.trim();
          
          // shared path pedestrians and bicycles (g1) 
          // DE:240 
          if (clip === 'rect(0px, 576px, 24px, 552px)' || 
              clip === 'rect(0px,576px,24px,552px)' ||
              clip.match(/0px[,\s]+576px[,\s]+24px[,\s]+552px/)) {
            foundSigns.add('DE:240');
          }

          // bicycles only (g1) 
          // DE:237
          if (clip === 'rect(360px, 648px, 384px, 624px)' || 
              clip === 'rect(360px,648px,384px,624px)' ||
              clip.match(/360px[,\s]+648px[,\s]+384px[,\s]+624px/)) {
            foundSigns.add('DE:237');
          }

          // Regulatory: Dual path bicycles and pedestrians (g1)
          // DE:241-30
          if (clip === 'rect(24px, 1863px, 48px, 1839px)' || 
              clip === 'rect(24px,1863px,48px,1839px)' ||
              clip.match(/24px[,\s]+1863px[,\s]+48px[,\s]+1839px/)) {
            foundSigns.add('DE:241-30');
          }

          // Regulatory: Dual path pedestrians and bicycles (g1)
          // DE:241-31
          if (clip === 'rect(922px, 108px, 946px, 84px)' || 
              clip === 'rect(922px,108px,946px,84px)' ||
              clip.match(/922px[,\s]+108px[,\s]+946px[,\s]+84px/)) {
            foundSigns.add('DE:241-31');
          }

          // Regulatory: Pedestrians only (g1)
          // DE:239
          if (clip === 'rect(624px, 870px, 648px, 846px)' || 
              clip === 'rect(624px,870px,648px,846px)' ||
              clip.match(/624px[,\s]+870px[,\s]+648px[,\s]+846px/)) {
            foundSigns.add('DE:239');
          }

          // Complementary: Except bicycles (g1)
          // DE:1022-10
          if (clip === 'rect(982px, 960px, 1006px, 936px)' || 
              clip === 'rect(982px,960px,1006px,936px)' ||
              clip.match(/982px[,\s]+960px[,\s]+1006px[,\s]+936px/)) {
            foundSigns.add('DE:1022-10');
          }
        }
      }

      // Prüfe spezielle Kombination: DE:239 und DE:1022-10 zusammen
      if (foundSigns.has('DE:239') && foundSigns.has('DE:1022-10')) {
        return 'DE:239,1022-10';
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