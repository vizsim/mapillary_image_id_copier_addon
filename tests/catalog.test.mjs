// Tests für lib/catalog.js und lib/settings.js — ausführen mit: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACKAGES, buildMapping, activeSignNames } from '../lib/catalog.js';
import { DEFAULT_SETTINGS } from '../lib/settings.js';
import { isTrafficSignName, normalizeSignCode } from '../lib/core.js';

const sprites = JSON.parse(readFileSync(new URL('./fixtures/sprites.json', import.meta.url), 'utf8'));
const allSigns = PACKAGES.flatMap((pkg) => pkg.signs);
const allNames = allSigns.map((sign) => sign.mapillary);
const codes = (mapping) => mapping.map((entry) => entry.code);

test('Katalog: eindeutige IDs und Namen, gültige Codes, Zeichen im Sprite vorhanden', () => {
  assert.equal(new Set(PACKAGES.map((pkg) => pkg.id)).size, PACKAGES.length);
  assert.equal(new Set(allNames).size, allSigns.length);
  for (const sign of allSigns) {
    assert.ok(isTrafficSignName(sign.mapillary), sign.mapillary);
    assert.equal(normalizeSignCode(sign.code), sign.code, sign.code);
    assert.ok(sign.name, sign.mapillary);
    assert.ok(sprites[sign.mapillary], `fehlt im Sprite: ${sign.mapillary}`);
  }
});

test('Standard: alle Pakete aktiv, Erkennung nutzt immer den ganzen Katalog', () => {
  assert.deepEqual(DEFAULT_SETTINGS.enabledPackages, ['cycling', 'access', 'other']);
  assert.deepEqual(activeSignNames(DEFAULT_SETTINGS), allNames);
  assert.deepEqual(codes(buildMapping(DEFAULT_SETTINGS)), allSigns.map((sign) => sign.code));
});

test('Aktive Zeichen: Pakete und einzelne Zeichen lassen sich ausschalten, die Erkennung bleibt gleich', () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    enabledPackages: ['cycling', 'other'],
    disabledSigns: ['regulatory--pedestrians-only--g1']
  };
  const active = activeSignNames(settings);
  assert.ok(!active.includes('regulatory--pedestrians-only--g1'));
  assert.ok(!active.includes('regulatory--no-heavy-goods-vehicles--g1'));
  assert.deepEqual(active.slice(-2), ['information--pedestrians-crossing--g1', 'regulatory--maximum-speed-limit-30--g1']);
  assert.deepEqual(activeSignNames({ ...DEFAULT_SETTINGS, enabledPackages: [] }), []);
  assert.equal(buildMapping(settings).length, allSigns.length);
});

test('Eigene Zuordnungen ersetzen Katalog-Einträge an derselben Stelle und kommen sonst ans Ende', () => {
  const mapping = buildMapping({
    customSigns: [
      { mapillary: 'regulatory--no-entry--g1', code: 'DE:267' },
      { mapillary: 'regulatory--bicycles-only--g1', code: 'DE:237-X' }
    ]
  });
  assert.equal(mapping[1].code, 'DE:237-X');
  assert.equal(mapping[1].name, 'Radweg');
  assert.equal(mapping[1].source, 'custom');
  assert.deepEqual(mapping.at(-1), { mapillary: 'regulatory--no-entry--g1', code: 'DE:267', name: '', source: 'custom' });
  assert.equal(mapping.length, allSigns.length + 1);
});

test('Eigene Zuordnungen sind immer aktiv, ohne Dopplungen', () => {
  assert.deepEqual(activeSignNames({
    enabledPackages: [],
    disabledSigns: [],
    customSigns: [{ mapillary: 'regulatory--no-entry--g1', code: 'DE:267' }]
  }), ['regulatory--no-entry--g1']);
  assert.deepEqual(activeSignNames({
    ...DEFAULT_SETTINGS,
    customSigns: [{ mapillary: 'regulatory--bicycles-only--g1', code: 'DE:237-X' }]
  }), allNames);
});
