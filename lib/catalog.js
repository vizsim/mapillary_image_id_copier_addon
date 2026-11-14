/**
 * Katalog: Zuordnung von Mapillary-Zeichen zu OSM traffic_sign-Codes, in Paketen.
 *
 * Die Zuordnungen stammen aus den Kampagnen in github.com/vizsim/mapillary_trafficsigns und sind
 * gegen die Sprite-Icons geprüft. Achtung bei den Varianten: DE:250 ist
 * "regulatory--road-closed-to-vehicles--g3"; "--g1" ist ein anderes Schild.
 *
 * Reihenfolge: Innerhalb von Haupt- und Zusatzzeichen bestimmt sie die Reihenfolge im
 * traffic_sign-Wert (siehe composeTrafficSign in core.js).
 * Paket-IDs werden gespeichert und dürfen sich nicht ändern.
 */
export const PACKAGES = [
  {
    id: 'cycling',
    name: 'Radverkehr',
    defaultEnabled: true,
    signs: [
      { mapillary: 'regulatory--shared-path-pedestrians-and-bicycles--g1', code: 'DE:240', name: 'Gemeinsamer Geh- und Radweg' },
      { mapillary: 'regulatory--bicycles-only--g1', code: 'DE:237', name: 'Radweg' },
      { mapillary: 'regulatory--dual-path-bicycles-and-pedestrians--g1', code: 'DE:241-30', name: 'Getrennter Rad- und Gehweg (Radweg links)' },
      { mapillary: 'regulatory--dual-path-pedestrians-and-bicycles--g1', code: 'DE:241-31', name: 'Getrennter Rad- und Gehweg (Radweg rechts)' },
      { mapillary: 'regulatory--pedestrians-only--g1', code: 'DE:239', name: 'Gehweg' },
      { mapillary: 'regulatory--end-of-bicycles-only--g2', code: 'DE:244.2', name: 'Ende Fahrradstraße' },
      { mapillary: 'complementary--except-bicycles--g1', code: 'DE:1022-10', name: 'Radfahrer frei' },
      { mapillary: 'complementary--two-way-traffic--g3', code: 'DE:1000-31', name: 'Beide Richtungen' },
      { mapillary: 'complementary--bike-route--g1', code: 'DE:1000-33', name: 'Radverkehr im Gegenverkehr' }
    ]
  },
  {
    id: 'access',
    name: 'Zufahrtsverbote',
    defaultEnabled: true,
    signs: [
      { mapillary: 'regulatory--road-closed-to-vehicles--g3', code: 'DE:250', name: 'Verbot für Fahrzeuge aller Art' },
      { mapillary: 'regulatory--no-motor-vehicles-except-motorcycles--g1', code: 'DE:251', name: 'Verbot für Kraftwagen' },
      { mapillary: 'regulatory--no-heavy-goods-vehicles--g1', code: 'DE:253', name: 'Verbot für Kraftfahrzeuge über 3,5 t' },
      { mapillary: 'regulatory--no-bicycles--g1', code: 'DE:254', name: 'Verbot für Radverkehr' },
      { mapillary: 'regulatory--no-motorcycles--g1', code: 'DE:255', name: 'Verbot für Krafträder' },
      { mapillary: 'regulatory--no-pedestrians--g1', code: 'DE:259', name: 'Verbot für Fußgänger' },
      { mapillary: 'regulatory--no-motor-vehicles--g1', code: 'DE:260', name: 'Verbot für Kraftfahrzeuge' }
    ]
  },
  {
    id: 'other',
    name: 'Weitere',
    defaultEnabled: true,
    signs: [
      { mapillary: 'information--pedestrians-crossing--g1', code: 'DE:350', name: 'Fußgängerüberweg' },
      { mapillary: 'regulatory--maximum-speed-limit-30--g1', code: 'DE:274-30', name: 'Zulässige Höchstgeschwindigkeit 30' }
    ]
  }
];

/**
 * Zuordnungen für die Erkennung: alle Zeichen des Katalogs, auch ausgeschaltete (das Popup zeigt
 * sie dann abgewählt an), dazu die eigenen Zuordnungen. Eine eigene Zuordnung ersetzt einen
 * Katalog-Eintrag mit demselben Mapillary-Namen an dessen Stelle, neue kommen ans Ende.
 *
 * @param {{customSigns: Array<{mapillary: string, code: string}>}} settings
 * @returns {Array<{mapillary: string, code: string, name: string, source: string}>}
 */
export function buildMapping({ customSigns }) {
  const byName = new Map();
  for (const pkg of PACKAGES) {
    for (const sign of pkg.signs) {
      byName.set(sign.mapillary, { ...sign, source: pkg.id });
    }
  }
  for (const { mapillary, code } of customSigns) {
    const name = byName.get(mapillary)?.name || '';
    byName.set(mapillary, { mapillary, code, name, source: 'custom' });
  }
  return [...byName.values()];
}

/**
 * Aktive Zeichen: werden automatisch kopiert und von "Filter ergänzen" in Mapillary eingeblendet.
 * Das sind die Zeichen eingeschalteter Pakete ohne abgewählte, dazu die eigenen Zuordnungen.
 *
 * @param {{enabledPackages: string[], disabledSigns: string[], customSigns: Array<{mapillary: string}>}} settings
 * @returns {string[]} - Mapillary-Namen
 */
export function activeSignNames({ enabledPackages, disabledSigns, customSigns }) {
  const enabled = new Set(enabledPackages);
  const disabled = new Set(disabledSigns);
  const fromPackages = PACKAGES
    .filter((pkg) => enabled.has(pkg.id))
    .flatMap((pkg) => pkg.signs.map((sign) => sign.mapillary))
    .filter((name) => !disabled.has(name));
  return [...new Set([...fromPackages, ...customSigns.map((custom) => custom.mapillary)])];
}
