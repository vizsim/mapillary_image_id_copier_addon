# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [0.3] - 2025-12-09

### Hinzugefügt
- Neues Verkehrszeichen: DE:1000-31 - Beide Richtungen (Complementary: Two way traffic)
- Unterstützung für Kombinationen mit DE:1000-31:
  - DE:237,1000-31 - Radweg mit beide Richtungen
  - DE:240,1000-31 - Gemeinsamer Geh- und Radweg mit beide Richtungen
  - DE:241-30,1000-31 - Getrennter Rad- und Gehweg (links) mit beide Richtungen
  - DE:241-31,1000-31 - Getrennter Rad- und Gehweg (rechts) mit beide Richtungen
  - DE:239,1022-10,1000-31 - Gehweg mit Radfahrer frei und beide Richtungen

### Verbessert
- Robustere Fehlerbehandlung: Alle Fehler werden jetzt geloggt für besseres Debugging
- Verbesserte Tab-Validierung: Prüft ob Tab noch existiert bevor Operationen ausgeführt werden
- Robustere Badge-Funktion: Fallback wenn Tab geschlossen wurde
- Service Worker Initialisierung: Bessere Überwachung des Service Worker Status
- Fehlerbehandlung für Script-Injection: Behandelt Fälle wenn Tab während Ausführung geschlossen wird

### Technisch
- Verbesserte Fehlerbehandlung in `showBadge()` Funktion
- Async/await für alle Badge-Operationen
- Console-Logging für alle Fehlerfälle
- Event Listener für Service Worker Lifecycle (onInstalled, onStartup)

## [0.2] - 2025-12-09

### Geändert
- Anpassung aller Verkehrszeichen-Erkennung an das neue Mapillary Sprite-Sheet (Dezember 2025)
- Alle clip-Werte für die unterstützten Verkehrszeichen aktualisiert:
  - DE:240 - Gemeinsamer Geh- und Radweg
  - DE:237 - Radweg
  - DE:241-30 - Getrennter Rad- und Gehweg (Radweg links)
  - DE:241-31 - Getrennter Rad- und Gehweg (Radweg rechts)
  - DE:239 - Gehweg
  - DE:1022-10 - Radfahrer frei

### Technisch
- Code-Refactoring: Verkehrszeichen-Mappings in zentrales `TRAFFIC_SIGN_MAPPING` Array verschoben
- Sprite-Sheet-URL dokumentiert: `https://external.xx.fbcdn.net/maps/vt/sprites/mapillary_sprites.png`
- Alte clip-Werte auskommentiert (für Referenz/Dokumentation)
- Verbesserte clip-Wert-Erkennung mit Normalisierung (unabhängig von Leerzeichen)

## [0.1] - 2025-12-08

### Hinzugefügt
- Automatische Erkennung von Mapillary Image IDs (pkey) aus der URL
- Automatische Erkennung von deutschen Verkehrszeichen im Mapillary-Viewer
- Unterstützung für folgende Verkehrszeichen:
  - DE:237 - Radweg
  - DE:240 - Gemeinsamer Geh- und Radweg
  - DE:241-30 - Getrennter Rad- und Gehweg (Radweg links)
  - DE:241-31 - Getrennter Rad- und Gehweg (Radweg rechts)
  - DE:239 - Gehweg
  - DE:1022-10 - Radfahrer frei
  - DE:239,1022-10 - Kombination: Gehweg mit Radfahrer frei
- Automatisches Kopieren von formatiertem Text in die Zwischenablage
- Integration mit OSM Traffic Sign Tool (automatisches Öffnen in neuem Tab)
- Konfigurierbare Optionen:
  - Tab automatisch öffnen (ein/aus)
  - Format des kopierten Textes anpassen:
    - mapillary={id} ein/aus
    - traffic_sign={code} ein/aus
    - traffic_sign:direction ein/aus
    - Standard-Richtung: forward oder backward
- Badge-Feedback am Extension-Icon (✓ für Erfolg, ! für Fehler)
- Prüfung ob aktuelle Seite eine Mapillary-URL ist
- Options-Seite für Einstellungen

### Technisch
- Manifest V3 kompatibel
- Service Worker Architektur
- Content Script Injection für DOM-Zugriff
- Chrome Storage API für Einstellungen
- Minimale Permissions (activeTab, scripting, tabs, storage)

