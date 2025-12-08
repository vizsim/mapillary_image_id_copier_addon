// Standard-Einstellungen
const DEFAULT_SETTINGS = {
  autoOpenTab: true,
  includeMapillary: true,
  includeTrafficSign: true,
  includeDirection: true,
  direction: 'forward' // 'forward' oder 'backward'
};

/**
 * Lädt die gespeicherten Einstellungen
 */
async function loadSettings() {
  const result = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  return {
    autoOpenTab: result.autoOpenTab !== undefined ? result.autoOpenTab : DEFAULT_SETTINGS.autoOpenTab,
    includeMapillary: result.includeMapillary !== undefined ? result.includeMapillary : DEFAULT_SETTINGS.includeMapillary,
    includeTrafficSign: result.includeTrafficSign !== undefined ? result.includeTrafficSign : DEFAULT_SETTINGS.includeTrafficSign,
    includeDirection: result.includeDirection !== undefined ? result.includeDirection : DEFAULT_SETTINGS.includeDirection,
    direction: result.direction !== undefined ? result.direction : DEFAULT_SETTINGS.direction
  };
}

/**
 * Speichert die Einstellungen
 */
async function saveSettings(settings) {
  await chrome.storage.local.set(settings);
  showStatus();
}

/**
 * Zeigt eine Erfolgsmeldung an
 */
function showStatus() {
  const status = document.getElementById('status');
  status.classList.add('show');
  setTimeout(() => {
    status.classList.remove('show');
  }, 2000);
}

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  const autoOpenTab = document.getElementById('autoOpenTab');
  const includeMapillary = document.getElementById('includeMapillary');
  const includeTrafficSign = document.getElementById('includeTrafficSign');
  const includeDirection = document.getElementById('includeDirection');
  const directionForward = document.getElementById('directionForward');
  const directionBackward = document.getElementById('directionBackward');
  const directionGroup = document.getElementById('directionGroup');
  
  // Lade aktuelle Einstellungen
  const settings = await loadSettings();
  autoOpenTab.checked = settings.autoOpenTab;
  includeMapillary.checked = settings.includeMapillary;
  includeTrafficSign.checked = settings.includeTrafficSign;
  includeDirection.checked = settings.includeDirection;
  
  // Richtung setzen
  if (settings.direction === 'backward') {
    directionBackward.checked = true;
  } else {
    directionForward.checked = true;
  }
  
  // Richtungs-Gruppe ein/ausblenden basierend auf includeDirection
  function updateDirectionGroupVisibility() {
    directionGroup.style.display = includeDirection.checked ? 'block' : 'none';
  }
  updateDirectionGroupVisibility();
  
  // Speichere bei Änderung
  autoOpenTab.addEventListener('change', async (e) => {
    await saveSettings({ autoOpenTab: e.target.checked });
  });
  
  includeMapillary.addEventListener('change', async (e) => {
    await saveSettings({ includeMapillary: e.target.checked });
  });
  
  includeTrafficSign.addEventListener('change', async (e) => {
    await saveSettings({ includeTrafficSign: e.target.checked });
  });
  
  includeDirection.addEventListener('change', async (e) => {
    updateDirectionGroupVisibility();
    await saveSettings({ includeDirection: e.target.checked });
  });
  
  directionForward.addEventListener('change', async (e) => {
    if (e.target.checked) {
      await saveSettings({ direction: 'forward' });
    }
  });
  
  directionBackward.addEventListener('change', async (e) => {
    if (e.target.checked) {
      await saveSettings({ direction: 'backward' });
    }
  });
});

