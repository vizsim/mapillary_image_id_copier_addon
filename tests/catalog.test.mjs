// Tests für lib/catalog.js und lib/settings.js — ausführen mit: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACKAGES, buildActiveMapping } from '../lib/catalog.js';
import { DEFAULT_SETTINGS } from '../lib/settings.js';
import { isTrafficSignName, normalizeSignCode } from '../lib/core.js';

const sprites = JSON.parse(readFileSync(new URL('./fixtures/sprites.json', import.meta.url), 'utf8'));
const allSigns = PACKAGES.flatMap((pkg) => pkg.signs);
const codes = (mapping) => mapping.map((entry) => entry.code);

test('Katalog: eindeutige IDs und Namen, gültige Codes, Zeichen im Sprite vorhanden', () => {
  assert.equal(new Set(PACKAGES.map((pkg) => pkg.id)).size, PACKAGES.length);
  assert.equal(new Set(allSigns.map((sign) => sign.mapillary)).size, allSigns.length);
  for (const sign of allSigns) {
    assert.ok(isTrafficSignName(sign.mapillary), sign.mapillary);
    assert.equal(normalizeSignCode(sign.code), sign.code, sign.code);
    assert.ok(sign.name, sign.mapillary);
    assert.ok(sprites[sign.mapillary], `fehlt im Sprite: ${sign.mapillary}`);
  }
});

test('Standard: nur das Paket Radverkehr ist aktiv', () => {
  assert.deepEqual(DEFAULT_SETTINGS.enabledPackages, ['cycling']);
  assert.deepEqual(codes(buildActiveMapping(DEFAULT_SETTINGS)), [
    'DE:240', 'DE:237', 'DE:241-30', 'DE:241-31', 'DE:239', 'DE:244.2', 'DE:1022-10', 'DE:1000-31', 'DE:1000-33'
  ]);
});

test('Pakete und einzelne Zeichen lassen sich abschalten', () => {
  const mapping = buildActiveMapping({
    ...DEFAULT_SETTINGS,
    enabledPackages: ['cycling', 'other'],
    disabledSigns: ['regulatory--pedestrians-only--g1']
  });
  assert.ok(!codes(mapping).includes('DE:239'));
  assert.deepEqual(codes(mapping).slice(-2), ['DE:350', 'DE:274-30']);
  assert.deepEqual(buildActiveMapping({ ...DEFAULT_SETTINGS, enabledPackages: [] }), []);
});

test('Eigene Zuordnungen ersetzen Paket-Einträge an derselben Stelle und kommen sonst ans Ende', () => {
  const mapping = buildActiveMapping({
    ...DEFAULT_SETTINGS,
    customSigns: [
      { mapillary: 'regulatory--no-entry--g1', code: 'DE:267' },
      { mapillary: 'regulatory--bicycles-only--g1', code: 'DE:237-X' }
    ]
  });
  assert.equal(mapping[1].code, 'DE:237-X');
  assert.equal(mapping[1].name, 'Radweg');
  assert.equal(mapping[1].source, 'custom');
  assert.deepEqual(mapping.at(-1), { mapillary: 'regulatory--no-entry--g1', code: 'DE:267', name: '', source: 'custom' });
  assert.equal(mapping.length, 10);
});

test('Eigene Zuordnungen gelten auch bei abgeschalteten Paketen', () => {
  const mapping = buildActiveMapping({
    ...DEFAULT_SETTINGS,
    enabledPackages: [],
    customSigns: [{ mapillary: 'regulatory--no-entry--g1', code: 'DE:267' }]
  });
  assert.deepEqual(codes(mapping), ['DE:267']);
});
