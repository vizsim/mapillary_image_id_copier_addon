/**
 * Einstellungsseite: Format des kopierten Texts, Zeichen-Pakete und eigene Zuordnungen
 */
import { loadSpriteIndex, isTrafficSignName, normalizeSignCode } from './lib/core.js';
import { PACKAGES } from './lib/catalog.js';
import { loadSettings, saveSettings } from './lib/settings.js';
import { el, signIcon } from './lib/dom.js';

const $ = (id) => document.getElementById(id);
const MAX_RESULTS = 40;
const INVALID_CODE = 'Bitte einen einzelnen Code wie DE:267 eingeben.';
const PACKAGE_SIGNS = new Map(PACKAGES.flatMap((pkg) => pkg.signs.map((sign) => [sign.mapillary, sign])));

let settings;
let sprites = {}; // Sprite-JSON, für Icons
let signNames = []; // alle Mapillary-Verkehrszeichen, für die Suche
let selectedName = null; // in der Suche ausgewähltes Zeichen
let statusTimer;

init();

async function init() {
  settings = await loadSettings();
  initGeneralOptions();
  initSearch();
  renderPackages();
  renderCustomSigns();

  try {
    ({ sprites } = await loadSpriteIndex());
    signNames = Object.keys(sprites).filter(isTrafficSignName).sort();
    $('search').disabled = false;
    $('search').placeholder = `${signNames.length} Mapillary-Zeichen durchsuchen, z. B. no-entry`;
    renderPackages();
    renderCustomSigns();
  } catch (err) {
    console.error('Sprite-Index konnte nicht geladen werden', err);
    $('sprite-error').hidden = false;
  }
}

async function save(changes) {
  Object.assign(settings, changes);
  await saveSettings(changes);
  const status = $('status');
  status.classList.add('show');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => status.classList.remove('show'), 2000);
}

function initGeneralOptions() {
  for (const key of ['autoOpenTab', 'includeMapillary', 'includeTrafficSign', 'includeDirection']) {
    const checkbox = $(key);
    checkbox.checked = settings[key];
    checkbox.addEventListener('change', async () => {
      updateDirectionGroup();
      await save({ [key]: checkbox.checked });
    });
  }
  for (const radio of [$('directionForward'), $('directionBackward')]) {
    radio.checked = radio.value === settings.direction;
    radio.addEventListener('change', async () => {
      if (radio.checked) {
        await save({ direction: radio.value });
      }
    });
  }
  updateDirectionGroup();
}

function updateDirectionGroup() {
  $('directionGroup').hidden = !$('includeDirection').checked;
}

// ---------------------------------------------------------------- Pakete

function renderPackages() {
  $('packages').replaceChildren(...PACKAGES.map((pkg) => {
    const enabled = settings.enabledPackages.includes(pkg.id);
    return el('div', { class: enabled ? 'option package' : 'option package off' },
      el('label', { class: 'package-header' },
        el('input', { type: 'checkbox', checked: enabled, onchange: (event) => togglePackage(pkg.id, event.target.checked) }),
        el('strong', {}, pkg.name),
        el('span', { class: 'muted' }, `${pkg.signs.length} Zeichen`)
      ),
      el('ul', { class: 'signs' }, ...pkg.signs.map((sign) => packageSignItem(sign, enabled)))
    );
  }));
}

function packageSignItem(sign, packageEnabled) {
  const override = settings.customSigns.find((custom) => custom.mapillary === sign.mapillary);
  return el('li', {},
    el('label', { class: 'sign' },
      el('input', {
        type: 'checkbox',
        checked: !settings.disabledSigns.includes(sign.mapillary),
        disabled: !packageEnabled,
        onchange: (event) => toggleSign(sign.mapillary, event.target.checked)
      }),
      signIcon(sign.mapillary, sprites),
      el('strong', { class: 'code' }, sign.code),
      el('span', {}, sign.name),
      override && el('span', { class: 'badge', title: 'Eigene Zuordnung hat Vorrang' }, `eigene: ${override.code}`)
    ),
    el('code', { class: 'mapillary-name' }, sign.mapillary)
  );
}

async function togglePackage(id, enabled) {
  const others = settings.enabledPackages.filter((pkg) => pkg !== id);
  await save({ enabledPackages: enabled ? [...others, id] : others });
  renderPackages();
}

async function toggleSign(name, enabled) {
  const others = settings.disabledSigns.filter((disabled) => disabled !== name);
  await save({ disabledSigns: enabled ? others : [...others, name] });
}

// ---------------------------------------------------------------- Eigene Zuordnungen

function renderCustomSigns() {
  const items = settings.customSigns.map((custom) => {
    const input = el('input', {
      type: 'text',
      value: custom.code,
      size: 10,
      'aria-label': `OSM-Code für ${custom.mapillary}`,
      oninput: () => input.setCustomValidity(''),
      onchange: () => updateCustomCode(custom.mapillary, input)
    });
    return el('li', { class: 'sign' },
      signIcon(custom.mapillary, sprites),
      input,
      el('code', { class: 'mapillary-name' }, custom.mapillary),
      el('button', { type: 'button', onclick: () => removeCustom(custom.mapillary) }, 'Entfernen')
    );
  });
  $('custom-list').replaceChildren(...(items.length > 0 ? items : [el('li', { class: 'muted' }, 'Noch keine eigenen Zuordnungen.')]));
}

async function updateCustomCode(name, input) {
  const code = normalizeSignCode(input.value);
  if (!code) {
    input.setCustomValidity(INVALID_CODE);
    input.reportValidity();
    return;
  }
  input.value = code;
  await save({ customSigns: settings.customSigns.map((custom) => (custom.mapillary === name ? { mapillary: name, code } : custom)) });
  renderPackages();
}

async function removeCustom(name) {
  await save({ customSigns: settings.customSigns.filter((custom) => custom.mapillary !== name) });
  renderCustomSigns();
  renderPackages();
}

// ---------------------------------------------------------------- Suche

function initSearch() {
  $('search').addEventListener('input', renderResults);
  $('add-code').addEventListener('input', () => $('add-code').setCustomValidity(''));
  $('add-form').addEventListener('submit', addCustomSign);
}

function renderResults() {
  const terms = $('search').value.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.length > 0 ? signNames.filter((name) => terms.every((term) => name.includes(term))) : [];

  $('results').replaceChildren(...hits.slice(0, MAX_RESULTS).map((name) => {
    const known = settings.customSigns.find((custom) => custom.mapillary === name) || PACKAGE_SIGNS.get(name);
    return el('li', {},
      el('button', { type: 'button', class: 'result', onclick: () => selectSign(name) },
        signIcon(name, sprites),
        el('code', {}, name),
        known && el('span', { class: 'muted' }, known.code)
      )
    );
  }));
  $('results-more').hidden = hits.length <= MAX_RESULTS;
  $('results-more').textContent = `… und ${hits.length - MAX_RESULTS} weitere. Suche genauer eingrenzen.`;
}

function selectSign(name) {
  selectedName = name;
  $('add-preview').replaceChildren(signIcon(name, sprites), el('code', {}, name));
  const custom = settings.customSigns.find((entry) => entry.mapillary === name);
  $('add-code').value = custom ? custom.code : '';
  $('add-form').hidden = false;
  $('add-code').focus();
}

async function addCustomSign(event) {
  event.preventDefault();
  const code = normalizeSignCode($('add-code').value);
  if (!selectedName || !code) {
    $('add-code').setCustomValidity(INVALID_CODE);
    $('add-code').reportValidity();
    return;
  }

  await save({
    customSigns: [...settings.customSigns.filter((custom) => custom.mapillary !== selectedName), { mapillary: selectedName, code }]
  });
  selectedName = null;
  $('add-form').hidden = true;
  $('search').value = '';
  renderResults();
  renderCustomSigns();
  renderPackages();
}
