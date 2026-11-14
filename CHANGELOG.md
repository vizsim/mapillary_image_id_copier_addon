# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [0.5.2] - 2026-11-14

### Behoben
- Blendete Mapillary schon alle Verkehrszeichen ein (`trafficSign[]=all` in der URL), meldete das Popup trotzdem fehlende Zeichen im Filter. „Alle Zeichen einblenden“ schreibt jetzt dasselbe Format wie Mapillary.
- Die Fußzeile im Popup bricht nicht mehr um. Die Einstellungen öffnet jetzt ein Zahnrad.

### Geändert
- README mit Screenshot. Beschreibung und Screenshots für den Chrome Web Store liegen jetzt in `docs/store/`.

## [0.5.1] - 2026-11-14

### Geändert
- Alle Pakete sind standardmäßig aktiv. Vorher war nur „Radverkehr“ aktiv, und z. B. DE:253 wurde nicht kopiert.
- Zeichen aus ausgeschalteten Paketen erkennt das Popup weiterhin. Es zeigt sie mit Code, aber abgewählt an und übernimmt sie per Haken. Vorher standen sie ohne Code unter „Ohne Zuordnung“.

## [0.5] - 2026-11-14

### Hinzugefügt
- Popup statt Badge: Ein Klick kopiert wie bisher sofort, und das Popup zeigt, was erkannt und kopiert wurde. Dort lassen sich die Richtung umschalten, einzelne Zeichen abwählen und Zeichen ohne Zuordnung direkt einem OSM-Code zuordnen.
- Zeichen-Pakete, in den Einstellungen ein- und ausschaltbar:
  - Radverkehr (standardmäßig aktiv), neu mit DE:244.2 (Ende Fahrradstraße) und DE:1000-33 (Radverkehr im Gegenverkehr)
  - Zufahrtsverbote: DE:250, 251, 253, 254, 255, 259, 260
  - Weitere: DE:350 (Fußgängerüberweg), DE:274-30 (Tempo 30)
- Eigene Zuordnungen von Mapillary-Zeichen zu OSM-Codes, mit Suche über alle Mapillary-Verkehrszeichen. Sie haben Vorrang vor den Paketen.
- Mapillary-Filter: Das Popup zeigt, welche Zeichen deiner Liste Mapillary nicht einblendet, und ergänzt sie auf Wunsch in der URL. Dazu „Alle Zeichen einblenden“ und „Nur meine Zeichen einblenden“.
- Hinweis, wenn nur Zusatzzeichen erkannt wurden und das Hauptzeichen fehlt.

### Geändert
- README gekürzt und an die Pakete angepasst.
- Kurzbeschreibung der Erweiterung überarbeitet.

### Technisch
- Der Service Worker entfällt. Die Logik steckt in ES-Modulen unter `lib/`, die Popup und Einstellungsseite gemeinsam nutzen.
- Tests mit `node --test`. Sie laufen auch im Release-Workflow vor dem Bauen des ZIPs.

## [0.4] - 2026-11-14

### Behoben
- Verkehrszeichen wurden nicht mehr erkannt: Mapillary hat das Sprite-Sheet erneut umgestellt (spätestens Oktober 2026). Die fest hinterlegten Positionen zeigten ins Leere oder auf falsche Zeichen. Zum Beispiel wurde `regulatory--road-closed-to-vehicles--g1` als DE:240 ausgegeben.
- Wurde kein Verkehrszeichen erkannt, wurde ein leeres `traffic_sign=` kopiert und trotzdem ein grüner Haken angezeigt. Jetzt wird nur die Bild-ID kopiert, und das Badge zeigt ein oranges „?“.
- Fehler beim Kopieren in die Zwischenablage wurden verschluckt (grüner Haken trotz Fehler). Jetzt erscheint ein rotes „!“.
- Kombinationen aus Haupt- und Zusatzzeichen werden jetzt allgemein gebildet statt nur für fest einprogrammierte Paare. Vorher konnte z. B. bei DE:239 + DE:1000-31 eines der Zeichen verloren gehen, und das Ergebnis hing von der Reihenfolge im DOM ab.
- Verkehrszeichen-Bilder in der README wurden nicht mehr angezeigt (404). Sie kommen jetzt aus dem npm-Paket `@osm-traffic-signs/converter` (über jsDelivr).
- Die Prüfung auf Mapillary-Seiten akzeptierte auch fremde Domains wie `mapillary.com.example.org`.
- Bei schnellem Doppelklick verschwand das Badge zu früh.

### Geändert
- Erkennung über die Index-Datei des Sprite-Sheets (`mapillary_sprites.json`): Die Position eines Symbols wird zur Laufzeit dem Mapillary-Namen zugeordnet (z. B. `regulatory--bicycles-only--g1`) und erst dieser Name dem OSM-Code. Künftige Umstellungen des Sprite-Sheets machen die Erkennung damit nicht mehr kaputt.
- Berechtigung `tabs` entfernt. Sie wurde nicht benötigt und löste bei der Installation die Warnung „Browserverlauf lesen“ aus.
- Neue Versionen gibt es unter [GitHub Releases](https://github.com/vizsim/mapillary_image_id_copier_addon/releases) statt im Ordner `releases/`. Sie werden beim Setzen eines Versions-Tags automatisch gebaut.

### Technisch
- `TRAFFIC_SIGN_MAPPING` ordnet jetzt Mapillary-Namen statt clip-Werten zu.
- Erkennungs-Details (erkannte Mapillary-Namen, `traffic_sign`-Wert, Zeichen ohne Zuordnung) stehen in der Konsole des Service Workers.
- Ungenutzten Code entfernt und JSDoc korrigiert.

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

