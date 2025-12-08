# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

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

