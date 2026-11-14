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
    defaultEnabled: false,
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
    defaultEnabled: false,
    signs: [
      { mapillary: 'information--pedestrians-crossing--g1', code: 'DE:350', name: 'Fußgängerüberweg' },
      { mapillary: 'regulatory--maximum-speed-limit-30--g1', code: 'DE:274-30', name: 'Zulässige Höchstgeschwindigkeit 30' }
    ]
  }
];

/**
 * Aktive Zuordnungen in fester Reihenfolge: erst die Zeichen aktiver Pakete (ohne abgewählte),
 * dann eigene Zuordnungen. Eine eigene Zuordnung ersetzt einen Paket-Eintrag mit demselben
 * Mapillary-Namen an dessen Stelle.
 *
 * @param {{enabledPackages: string[], disabledSigns: string[], customSigns: Array<{mapillary: string, code: string}>}} settings
 * @returns {Array<{mapillary: string, code: string, name: string, source: string}>}
 */
export function buildActiveMapping({ enabledPackages, disabledSigns, customSigns }) {
  const enabled = new Set(enabledPackages);
  const disabled = new Set(disabledSigns);
  const byName = new Map();

  for (const pkg of PACKAGES) {
    if (!enabled.has(pkg.id)) {
      continue;
    }
    for (const sign of pkg.signs) {
      if (!disabled.has(sign.mapillary)) {
        byName.set(sign.mapillary, { ...sign, source: pkg.id });
      }
    }
  }
  for (const { mapillary, code } of customSigns) {
    const name = byName.get(mapillary)?.name || '';
    byName.set(mapillary, { mapillary, code, name, source: 'custom' });
  }

  return [...byName.values()];
}
