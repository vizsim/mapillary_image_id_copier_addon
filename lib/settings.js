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
  enabledPackages: PACKAGES.filter((pkg) => pkg.defaultEnabled).map((pkg) => pkg.id),
  disabledSigns: [], // Mapillary-Namen abgewählter Paket-Zeichen
  customSigns: [] // eigene Zuordnungen: [{ mapillary, code }]
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
