// Tests für lib/core.js — ausführen mit: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as core from '../lib/core.js';
import { buildMapping, activeSignNames } from '../lib/catalog.js';
import { DEFAULT_SETTINGS } from '../lib/settings.js';

// Ausschnitt aus der echten mapillary_sprites.json (Stand November 2026)
const sprites = JSON.parse(readFileSync(new URL('./fixtures/sprites.json', import.meta.url), 'utf8'));
const { nameByPosition } = core.buildSpriteIndex(sprites);
const defaultMapping = buildMapping(DEFAULT_SETTINGS);

/** clip-Wert, wie ihn der Mapillary-Viewer für ein Zeichen setzt */
function clipFor(name, separator = ', ') {
  const { x, y, width, height } = sprites[name];
  return `rect(${[`${y}px`, `${x + width}px`, `${y + height}px`, `${x}px`].join(separator)})`;
}

/** Erkennung wie im Popup: clip-Werte → Mapillary-Namen → Zuordnung → traffic_sign */
function detect(names, mapping = defaultMapping) {
  const resolved = core.resolveSpriteNames(names.map((name) => clipFor(name)), nameByPosition);
  const { matched, unmapped } = core.matchSigns(resolved.names, mapping);
  return { trafficSign: core.composeTrafficSign(matched), unmapped, unknownClips: resolved.unknownClips };
}

const SETTINGS = { includeMapillary: true, includeTrafficSign: true, includeDirection: true, direction: 'forward' };

test('isMapillaryUrl akzeptiert nur mapillary.com und Subdomains', () => {
  assert.equal(core.isMapillaryUrl('https://www.mapillary.com/app/?pKey=1'), true);
  assert.equal(core.isMapillaryUrl('https://mapillary.com/app/?pKey=1'), true);
  assert.equal(core.isMapillaryUrl('https://mapillary.com.evil.example/app/'), false);
  assert.equal(core.isMapillaryUrl('https://notmapillary.com/app/'), false);
  assert.equal(core.isMapillaryUrl('chrome://extensions/'), false);
  assert.equal(core.isMapillaryUrl('kein url'), false);
});

test('extractPkey liest die Bild-ID', () => {
  assert.equal(core.extractPkey('https://www.mapillary.com/app/?pKey=261103190300401&focus=photo'), '261103190300401');
  assert.equal(core.extractPkey('https://www.mapillary.com/app/?pKey=abc123'), null);
  assert.equal(core.extractPkey('https://www.mapillary.com/app/?lat=52.5&lng=13.4'), null);
});

test('parseClipRect versteht Komma, Leerzeichen und ungültige Werte', () => {
  assert.deepEqual(core.parseClipRect('rect(0px, 624px, 24px, 600px)'), { x: 600, y: 0, width: 24, height: 24 });
  assert.deepEqual(core.parseClipRect(' rect(0 624px 24px 600px) '), { x: 600, y: 0, width: 24, height: 24 });
  for (const invalid of ['auto', '', 'rect(1px, 2px)', 'rect(auto, auto, auto, auto)']) {
    assert.equal(core.parseClipRect(invalid), null, invalid);
  }
});

test('Einzelzeichen und Kombinationen wie in v0.4, unabhängig von der DOM-Reihenfolge', () => {
  const cases = [
    [['regulatory--shared-path-pedestrians-and-bicycles--g1'], 'DE:240'],
    [['regulatory--pedestrians-only--g1', 'complementary--except-bicycles--g1'], 'DE:239,1022-10'],
    [['regulatory--bicycles-only--g1', 'complementary--two-way-traffic--g3'], 'DE:237,1000-31'],
    [['regulatory--dual-path-bicycles-and-pedestrians--g1', 'complementary--two-way-traffic--g3'], 'DE:241-30,1000-31'],
    [['regulatory--dual-path-pedestrians-and-bicycles--g1', 'complementary--two-way-traffic--g3'], 'DE:241-31,1000-31'],
    [['regulatory--pedestrians-only--g1', 'complementary--except-bicycles--g1', 'complementary--two-way-traffic--g3'], 'DE:239,1022-10,1000-31']
  ];
  for (const [names, expected] of cases) {
    assert.equal(detect(names).trafficSign, expected);
    assert.equal(detect([...names].reverse()).trafficSign, expected);
  }
});

test('Neue Zeichen im Paket Radverkehr', () => {
  assert.equal(detect(['regulatory--end-of-bicycles-only--g2']).trafficSign, 'DE:244.2');
  assert.equal(detect(['complementary--bike-route--g1', 'regulatory--bicycles-only--g1']).trafficSign, 'DE:237,1000-33');
});

test('Doppelte Symbole zählen einmal, Hauptzeichen stehen vor Zusatzzeichen', () => {
  const shared = 'regulatory--shared-path-pedestrians-and-bicycles--g1';
  assert.equal(detect([shared, shared]).trafficSign, 'DE:240');
  assert.equal(detect(['complementary--except-bicycles--g1', 'regulatory--pedestrians-only--g1', shared]).trafficSign, 'DE:240,239,1022-10');
});

test('Zeichen ohne Zuordnung landen in unmapped, Markierungen und POIs nicht', () => {
  const result = detect(['regulatory--no-entry--g1', 'marking--discrete--arrow--left', 'airport']);
  assert.equal(result.trafficSign, '');
  assert.deepEqual(result.unmapped, ['regulatory--no-entry--g1']);
});

test('Erkennung kennt den ganzen Katalog, unabhängig von den Paket-Haken', () => {
  const mapping = buildMapping({ ...DEFAULT_SETTINGS, enabledPackages: [] });
  assert.equal(detect(['regulatory--no-heavy-goods-vehicles--g1'], mapping).trafficSign, 'DE:253');
  assert.equal(detect(['information--pedestrians-crossing--g1'], mapping).trafficSign, 'DE:350');
});

test('road-closed-to-vehicles: nur --g3 ist DE:250, --g1 bleibt ohne Zuordnung', () => {
  assert.equal(detect(['regulatory--road-closed-to-vehicles--g3']).trafficSign, 'DE:250');
  assert.deepEqual(detect(['regulatory--road-closed-to-vehicles--g1']).unmapped, ['regulatory--road-closed-to-vehicles--g1']);
});

test('clip-Werte ohne Treffer im Sprite-Index werden gemeldet', () => {
  const result = core.resolveSpriteNames(['rect(1px, 25px, 25px, 1px)', clipFor('regulatory--bicycles-only--g1', ' ')], nameByPosition);
  assert.deepEqual(result.names, ['regulatory--bicycles-only--g1']);
  assert.deepEqual(result.unknownClips, ['rect(1px, 25px, 25px, 1px)']);
});

test('composeTrafficSign: Länder, ohne Präfix, leer', () => {
  assert.equal(core.composeTrafficSign([
    { mapillary: 'regulatory--a', code: 'DE:240' },
    { mapillary: 'complementary--b', code: 'DE:1022-10' },
    { mapillary: 'regulatory--c', code: 'AT:52' }
  ]), 'DE:240,1022-10;AT:52');
  assert.equal(core.composeTrafficSign([{ mapillary: 'regulatory--x', code: '240' }]), '240');
  assert.equal(core.composeTrafficSign([]), '');
});

test('buildClipboardText folgt den Einstellungen', () => {
  assert.equal(core.buildClipboardText('1', 'DE:240', SETTINGS), 'mapillary=1\ntraffic_sign=DE:240\ntraffic_sign:direction=forward');
  assert.equal(core.buildClipboardText('1', 'DE:240', { ...SETTINGS, direction: 'backward' }), 'mapillary=1\ntraffic_sign=DE:240\ntraffic_sign:direction=backward');
  assert.equal(core.buildClipboardText('1', 'DE:240', { ...SETTINGS, includeMapillary: false, includeDirection: false }), 'traffic_sign=DE:240');
  assert.equal(core.buildClipboardText('1', '', SETTINGS), 'mapillary=1');
  assert.equal(core.buildClipboardText('1', '', { ...SETTINGS, includeMapillary: false }), '');
});

test('normalizeSignCode ergänzt DE und lehnt Kombinationen ab', () => {
  assert.equal(core.normalizeSignCode('267'), 'DE:267');
  assert.equal(core.normalizeSignCode(' de:1022-10 '), 'DE:1022-10');
  assert.equal(core.normalizeSignCode('DE:244.2'), 'DE:244.2');
  assert.equal(core.normalizeSignCode('DE:274[30]'), 'DE:274[30]');
  for (const invalid of ['', '   ', 'DE:', 'DE:240,1000-31', 'DE:240;DE:239', ':240']) {
    assert.equal(core.normalizeSignCode(invalid), null, invalid);
  }
});

test('trafficSignToolUrl kodiert den Wert', () => {
  assert.equal(core.trafficSignToolUrl('DE:240,1000-31'), 'https://trafficsigns.osm-verkehrswende.org/DE?signs=DE%3A240%2C1000-31');
});

// Aufgebaut wie eine echte Mapillary-URL mit Verkehrszeichen-Filter (Ort und Bild ausgedacht)
const FILTER_URL = 'https://www.mapillary.com/app/?lat=52.52&lng=13.405&z=17&showNerf=false'
  + '&trafficSign%5B%5D=regulatory--bicycles-only--g1'
  + '&trafficSign%5B%5D=regulatory--shared-path-pedestrians-and-bicycles--g1'
  + '&trafficSign%5B%5D=regulatory--dual-path-bicycles-and-pedestrians--g1'
  + '&trafficSign%5B%5D=regulatory--dual-path-pedestrians-and-bicycles--g1'
  + '&trafficSign%5B%5D=complementary--except-bicycles--g1'
  + '&trafficSign%5B%5D=complementary--bike-route--g1'
  + '&mapFeature%5B%5D=marking--discrete--symbol--bicycle&dateFrom=2025-08-01&focus=photo'
  + '&pKey=261103190300401&x=0.5&y=0.35&zoom=0.1';
const cyclingNames = activeSignNames({ ...DEFAULT_SETTINGS, enabledPackages: ['cycling'] });

/** alle Parameter außer dem Verkehrszeichen-Filter */
function otherParams(url) {
  return [...new URL(url).searchParams].filter(([key]) => !key.startsWith('trafficSign'));
}

test('Filter: eingeblendete und fehlende Zeichen', () => {
  const shown = core.shownTrafficSigns(FILTER_URL);
  assert.equal(shown.all, false);
  assert.equal(shown.names.size, 6);
  assert.deepEqual(core.missingTrafficSigns(FILTER_URL, cyclingNames), [
    'regulatory--pedestrians-only--g1',
    'regulatory--end-of-bicycles-only--g2',
    'complementary--two-way-traffic--g3'
  ]);
  assert.deepEqual(core.missingTrafficSigns('https://www.mapillary.com/app/?trafficSign=all&pKey=1', cyclingNames), []);
  // So schreibt Mapillary selbst "alle Zeichen" in die URL
  const mapillaryAll = core.shownTrafficSigns('https://www.mapillary.com/app/?pKey=1&trafficSign%5B%5D=all&x=0.5');
  assert.equal(mapillaryAll.all, true);
  assert.equal(mapillaryAll.names.size, 0);
  assert.deepEqual(core.missingTrafficSigns('https://www.mapillary.com/app/?pKey=1&trafficSign%5B%5D=all', cyclingNames), []);
  assert.deepEqual(core.missingTrafficSigns('https://www.mapillary.com/app/?pKey=1', ['a', 'b', 'a']), ['a', 'b']);
});

test('Filter ergänzen: hängt fehlende Zeichen an, alles andere bleibt', () => {
  const result = core.withTrafficSigns(FILTER_URL, cyclingNames);
  const listed = new URL(result).searchParams.getAll('trafficSign[]');
  assert.equal(listed.length, 9);
  assert.deepEqual(listed.slice(0, 6), [...core.shownTrafficSigns(FILTER_URL).names]);
  assert.deepEqual(new Set(listed), new Set(cyclingNames.concat(listed.slice(0, 6))));
  assert.deepEqual(otherParams(result), otherParams(FILTER_URL));
  assert.match(result, /trafficSign%5B%5D=regulatory--pedestrians-only--g1/);
  assert.deepEqual(core.missingTrafficSigns(result, cyclingNames), []);
});

test('Filter: alle einblenden und nur meine Zeichen', () => {
  const all = core.withAllTrafficSigns(FILTER_URL);
  assert.deepEqual(new URL(all).searchParams.getAll('trafficSign[]'), ['all']);
  assert.equal(new URL(all).searchParams.get('trafficSign'), null);
  assert.match(all, /trafficSign%5B%5D=all/);
  assert.deepEqual(otherParams(all), otherParams(FILTER_URL));
  assert.equal(core.shownTrafficSigns(all).all, true);

  const only = core.withOnlyTrafficSigns(all, cyclingNames);
  assert.equal(new URL(only).searchParams.get('trafficSign'), null);
  assert.deepEqual(new URL(only).searchParams.getAll('trafficSign[]'), cyclingNames);
  assert.deepEqual(otherParams(only), otherParams(FILTER_URL));
});

test('collectSignClips liest clip aus dem style, ignoriert mask-clip und auto', () => {
  const images = [
    { getAttribute: () => 'mask-clip: border-box; clip: rect(408px, 720px, 432px, 696px)', style: {} },
    { getAttribute: () => 'position: absolute; clip: auto', style: {} },
    { getAttribute: () => null, style: { clip: 'rect(0px, 24px, 24px, 0px)' } }
  ];
  globalThis.document = {
    querySelectorAll(selector) {
      assert.equal(selector, '.mapillary-tag-symbol img');
      return images;
    }
  };
  try {
    assert.deepEqual(core.collectSignClips(), ['rect(408px, 720px, 432px, 696px)', 'rect(0px, 24px, 24px, 0px)']);
  } finally {
    delete globalThis.document;
  }
});

test('loadSpriteIndex lädt die JSON und meldet HTTP-Fehler', async () => {
  const index = await core.loadSpriteIndex(async (url) => {
    assert.equal(url, core.SPRITE_INDEX_URL);
    return { ok: true, json: async () => sprites };
  });
  assert.equal(index.nameByPosition.get(core.spriteKey(sprites['regulatory--bicycles-only--g1'])), 'regulatory--bicycles-only--g1');
  await assert.rejects(core.loadSpriteIndex(async () => ({ ok: false, status: 404 })), /HTTP 404/);
});
