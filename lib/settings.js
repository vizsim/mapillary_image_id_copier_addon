import { PACKAGES } from './catalog.js';

/**
 * Standard-Einstellungen. Fehlende Werte in chrome.storage.local werden damit ergänzt.
 */
export const DEFAULT_SETTINGS = {
  autoOpenTab: true,
  includeMapillary: true,
  includeTrafficSign: true,
  includeDirection: true,
  direction: 'forward', // 'forward' oder 'backward'
  // Aktive Zeichen werden automatisch kopiert und in den Mapillary-Filter übernommen.
  // Ausgeschaltete erkennt das Popup weiterhin, zeigt sie aber abgewählt an.
  enabledPackages: PACKAGES.filter((pkg) => pkg.defaultEnabled).map((pkg) => pkg.id),
  disabledSigns: [], // Mapillary-Namen ausgeschalteter Paket-Zeichen
  customSigns: [] // eigene Zuordnungen: [{ mapillary, code }], immer aktiv
};

/**
 * Lädt alle Einstellungen. Arrays nie direkt verändern, sondern neue speichern.
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export function loadSettings() {
  return chrome.storage.local.get(DEFAULT_SETTINGS);
}

/**
 * @param {Partial<typeof DEFAULT_SETTINGS>} changes
 */
export function saveSettings(changes) {
  return chrome.storage.local.set(changes);
}
