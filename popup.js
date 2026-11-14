/**
 * Popup: erkennt beim Öffnen die Verkehrszeichen im aktuellen Mapillary-Bild, kopiert sofort
 * und zeigt, was erkannt wurde. Änderungen (Richtung, Auswahl, Zuordnung) kopieren neu.
 */
import {
  isMapillaryUrl, extractPkey, loadSpriteIndex, resolveSpriteNames, matchSigns, composeTrafficSign,
  buildClipboardText, normalizeSignCode, trafficSignToolUrl, isSupplementary, shownTrafficSigns,
  missingTrafficSigns, withTrafficSigns, withOnlyTrafficSigns, withAllTrafficSigns, collectSignClips
} from './lib/core.js';
import { buildActiveMapping } from './lib/catalog.js';
import { loadSettings, saveSettings } from './lib/settings.js';
import { el, signIcon } from './lib/dom.js';

const $ = (id) => document.getElementById(id);
const STATUS_ICONS = { success: '✓', warning: '?', error: '!' };

const state = {
  tab: null,
  settings: null,
  mapping: [], // aktive Zuordnungen (Pakete + eigene)
  imageId: null,
  sprites: {}, // Sprite-JSON, für die Icons
  names: [], // erkannte Mapillary-Namen
  symbolCount: 0, // Anzahl Verkehrszeichen-Symbole im Viewer
  spriteError: null,
  deselected: new Set() // im Popup abgewählte Mapillary-Namen
};

$('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('open-tool').addEventListener('click', () => openTool(true));
$('filter-add').addEventListener('click', () => navigate(withTrafficSigns(state.tab.url, activeNames())));
for (const radio of [$('direction-forward'), $('direction-backward')]) {
  radio.addEventListener('change', () => changeDirection(radio));
}

init().catch((err) => {
  console.error(err);
  showStatus('error', 'Unerwarteter Fehler', String(err?.message || err));
});

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.tab = tab;
  state.settings = await loadSettings();
  state.mapping = buildActiveMapping(state.settings);

  if (!tab?.url || !isMapillaryUrl(tab.url)) {
    showStatus('error', 'Keine Mapillary-Seite', 'Öffne ein Bild auf mapillary.com und klicke dann auf das Icon.');
    return;
  }

  state.imageId = extractPkey(tab.url);
  if (!state.imageId) {
    showStatus('error', 'Kein Bild ausgewählt', 'Die URL enthält keine Bild-ID (pKey). Wähle in Mapillary ein Bild aus.');
    renderFilter();
    return;
  }

  await detect();
  renderDirection();
  renderSigns();
  renderFilter();
  await copyToClipboard();

  if (currentTrafficSign() && state.settings.autoOpenTab) {
    await openTool(false);
  }
}

/**
 * Liest die Symbole im Viewer und ordnet sie über den Sprite-Index Mapillary-Namen zu
 */
async function detect() {
  const [{ result: clips } = {}] = await chrome.scripting.executeScript({
    target: { tabId: state.tab.id },
    func: collectSignClips
  });
  state.symbolCount = Array.isArray(clips) ? clips.length : 0;
  if (state.symbolCount === 0) {
    return;
  }

  try {
    const index = await loadSpriteIndex();
    const { names, unknownClips } = resolveSpriteNames(clips, index.nameByPosition);
    state.sprites = index.sprites;
    state.names = names;
    if (unknownClips.length > 0) {
      console.warn('clip-Werte ohne Treffer im Sprite-Index', unknownClips);
    }
  } catch (err) {
    state.spriteError = err;
    console.error('Sprite-Index konnte nicht geladen werden', err);
  }
}

function activeNames() {
  return state.mapping.map((entry) => entry.mapillary);
}

function selectedEntries() {
  return matchSigns(state.names, state.mapping).matched.filter((entry) => !state.deselected.has(entry.mapillary));
}

function currentTrafficSign() {
  return composeTrafficSign(selectedEntries());
}

/**
 * Kopiert den Text zur aktuellen Auswahl und zeigt das Ergebnis an
 */
async function copyToClipboard() {
  const entries = selectedEntries();
  const trafficSign = composeTrafficSign(entries);
  const text = buildClipboardText(state.imageId, trafficSign, state.settings);

  $('copied').textContent = text;
  $('copied').hidden = !text;
  $('open-tool').hidden = !trafficSign;

  if (!text) {
    showStatus('warning', 'Nichts kopiert', noSignReason());
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    showStatus('error', 'Kopieren fehlgeschlagen', String(err?.message || err));
    return;
  }

  if (!trafficSign) {
    showStatus('warning', 'Nur die Bild-ID kopiert', noSignReason());
  } else if (entries.every((entry) => isSupplementary(entry.mapillary))) {
    showStatus('warning', 'Kopiert, aber nur Zusatzzeichen erkannt', 'Das Hauptzeichen fehlt oder ist noch keinem OSM-Code zugeordnet.');
  } else {
    showStatus('success', 'In die Zwischenablage kopiert');
  }
}

function noSignReason() {
  if (state.spriteError) {
    return 'Die Zeichen-Daten von Mapillary konnten nicht geladen werden.';
  }
  if (state.symbolCount === 0) {
    return 'Mapillary zeigt in diesem Bild keine Verkehrszeichen an.';
  }
  const { matched, unmapped } = matchSigns(state.names, state.mapping);
  if (matched.length > 0) {
    return 'Alle erkannten Zeichen sind abgewählt.';
  }
  if (unmapped.length > 0) {
    return 'Die erkannten Zeichen sind noch keinem OSM-Code zugeordnet.';
  }
  return 'Kein bekanntes Verkehrszeichen erkannt.';
}

function showStatus(kind, title, detail = '') {
  const status = $('status');
  status.className = `status ${kind}`;
  status.replaceChildren(...[el('strong', {}, `${STATUS_ICONS[kind]} ${title}`), detail && el('p', {}, detail)].filter(Boolean));
}

function renderDirection() {
  const { includeDirection, includeTrafficSign, direction } = state.settings;
  $('direction').hidden = !(includeDirection && includeTrafficSign);
  $('direction-forward').checked = direction !== 'backward';
  $('direction-backward').checked = direction === 'backward';
}

async function changeDirection(radio) {
  if (!radio.checked) {
    return;
  }
  state.settings = { ...state.settings, direction: radio.value };
  await saveSettings({ direction: radio.value });
  await copyToClipboard();
}

function renderSigns() {
  const { matched, unmapped } = matchSigns(state.names, state.mapping);
  $('detected').hidden = matched.length === 0;
  $('detected-list').replaceChildren(...matched.map(detectedItem));
  $('unmapped').hidden = unmapped.length === 0;
  $('unmapped-list').replaceChildren(...unmapped.map(unmappedItem));
}

function detectedItem(entry) {
  return el('li', {},
    el('label', { class: 'sign' },
      el('input', {
        type: 'checkbox',
        checked: !state.deselected.has(entry.mapillary),
        onchange: (event) => toggleSign(entry.mapillary, event.target.checked)
      }),
      signIcon(entry.mapillary, state.sprites),
      el('span', { class: 'sign-text' }, el('strong', {}, entry.code), entry.name ? ` ${entry.name}` : '')
    )
  );
}

function unmappedItem(name) {
  const input = el('input', {
    type: 'text',
    placeholder: 'DE:…',
    required: true,
    'aria-label': `OSM-Code für ${name}`,
    oninput: () => input.setCustomValidity('')
  });
  return el('li', {},
    el('form', { class: 'sign', onsubmit: (event) => assignCode(event, name, input) },
      signIcon(name, state.sprites),
      el('code', { class: 'sign-text', title: name }, name),
      input,
      el('button', { type: 'submit' }, 'Zuordnen')
    )
  );
}

async function toggleSign(name, selected) {
  if (selected) {
    state.deselected.delete(name);
  } else {
    state.deselected.add(name);
  }
  await copyToClipboard();
}

/**
 * Speichert die Zuordnung eines unbekannten Zeichens als eigene Zuordnung und kopiert neu
 */
async function assignCode(event, name, input) {
  event.preventDefault();
  const code = normalizeSignCode(input.value);
  if (!code) {
    input.setCustomValidity('Bitte einen einzelnen Code wie DE:267 eingeben.');
    input.reportValidity();
    return;
  }

  const customSigns = [...state.settings.customSigns.filter((custom) => custom.mapillary !== name), { mapillary: name, code }];
  await saveSettings({ customSigns });
  state.settings = { ...state.settings, customSigns };
  state.mapping = buildActiveMapping(state.settings);
  renderSigns();
  renderFilter();
  await copyToClipboard();
}

/**
 * Hinweis auf Zeichen, die Mapillary nicht einblendet, und Umschalter alle/nur meine Zeichen
 */
function renderFilter() {
  const url = state.tab.url;
  const names = activeNames();
  const shown = shownTrafficSigns(url);
  const missing = missingTrafficSigns(url, names);

  $('filter').hidden = missing.length === 0;
  $('filter-text').textContent = missing.length === 1
    ? '1 Zeichen aus deiner Liste ist in Mapillary nicht eingeblendet.'
    : `${missing.length} Zeichen aus deiner Liste sind in Mapillary nicht eingeblendet.`;

  const toggle = $('filter-toggle');
  toggle.hidden = false;
  toggle.textContent = shown.all ? 'Nur meine Zeichen einblenden' : 'Alle Zeichen einblenden';
  toggle.onclick = () => navigate(shown.all ? withOnlyTrafficSigns(url, names) : withAllTrafficSigns(url));
}

/**
 * Lädt den Mapillary-Tab mit neuer URL. Das Popup schließt sich; danach erneut klicken.
 */
async function navigate(url) {
  await chrome.tabs.update(state.tab.id, { url });
  window.close();
}

async function openTool(active) {
  await chrome.tabs.create({
    url: trafficSignToolUrl(currentTrafficSign()),
    active,
    index: state.tab.index + 1
  });
}
