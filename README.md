# Mapillary Traffic Sign & Image ID Copier

Eine Chrome-Erweiterung, die Mapillary Image IDs und Verkehrszeichen-Informationen automatisch erkennt und in die Zwischenablage kopiert.

## Features

- 🎯 **Automatische Erkennung**: Extrahiert die Mapillary Image ID (pkey) aus der aktuellen URL
- 🚦 **Verkehrszeichen-Erkennung**: Erkennt automatisch verschiedene deutsche Verkehrszeichen im Mapillary-Viewer
- 📋 **Formatierter Output**: Kopiert die Daten im richtigen Format für OSM-Tagging
- 🔗 **Traffic Sign Tool Integration**: Öffnet automatisch das [OSM Traffic Sign Tool](https://trafficsigns.osm-verkehrswende.org/) für das erkannte Verkehrszeichen

## Unterstützte Verkehrszeichen

Die Erweiterung erkennt folgende deutsche Verkehrszeichen:

| VZ-Code | Beschreibung | Verkehrszeichen | Mapillary Wording |
|---------|-------------|:---------------:|------------------|
| DE:237 | Radweg | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_237.svg" width="40" alt="DE:237"> | `regulatory--bicycles-only--g1` |
| DE:240 | Gemeinsamer Geh- und Radweg | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_240.svg" width="40" alt="DE:240"> | `regulatory--shared-path-pedestrians-and-bicycles--g1` |
| DE:241-30 | Getrennter Rad- und Gehweg (Radweg links) | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_241_30.svg" width="40" alt="DE:241-30"> | `regulatory--dual-path-bicycles-and-pedestrians--g1` |
| DE:241-31 | Getrennter Rad- und Gehweg (Radweg rechts) | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_241_31.svg" width="40" alt="DE:241-31"> | `regulatory--dual-path-pedestrians-and-bicycles--g1` |
| DE:239 | Gehweg | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_239.svg" width="40" alt="DE:239"> | `regulatory--pedestrians-only--g1` |
| DE:1022-10 | Radfahrer frei | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1022_10.svg" width="40" alt="DE:1022-10"> | `complementary--except-bicycles--g1` |
| DE:1000-31 | Beide Richtungen | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | `complementary--two-way-traffic--g3` |
| DE:239,1022-10 | Gehweg mit Radfahrer frei | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_239.svg" width="40" alt="DE:239"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1022_10.svg" width="40" alt="DE:1022-10"> | `regulatory--pedestrians-only--g1`<br>`complementary--except-bicycles--g1` |
| DE:237,1000-31 | Radweg mit beide Richtungen | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_237.svg" width="40" alt="DE:237"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | `regulatory--bicycles-only--g1`<br>`complementary--two-way-traffic--g3` |
| DE:240,1000-31 | Gemeinsamer Geh- und Radweg mit beide Richtungen | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_240.svg" width="40" alt="DE:240"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | `regulatory--shared-path-pedestrians-and-bicycles--g1`<br>`complementary--two-way-traffic--g3` |
| DE:241-30,1000-31 | Getrennter Rad- und Gehweg (links) mit beide Richtungen | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_241_30.svg" width="40" alt="DE:241-30"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | `regulatory--dual-path-bicycles-and-pedestrians--g1`<br>`complementary--two-way-traffic--g3` |
| DE:241-31,1000-31 | Getrennter Rad- und Gehweg (rechts) mit beide Richtungen | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_241_31.svg" width="40" alt="DE:241-31"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | `regulatory--dual-path-pedestrians-and-bicycles--g1`<br>`complementary--two-way-traffic--g3` |
| DE:239,1022-10,1000-31 | Gehweg mit Radfahrer frei und beide Richtungen | <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_239.svg" width="40" alt="DE:239"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1022_10.svg" width="40" alt="DE:1022-10"> + <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | `regulatory--pedestrians-only--g1`<br>`complementary--except-bicycles--g1`<br>`complementary--two-way-traffic--g3` |

Werden mehrere Zeichen erkannt, kombiniert die Erweiterung sie automatisch: erst die Hauptzeichen, dann die Zusatzzeichen. Die Kombinationen in der Tabelle sind Beispiele dafür.

## Installation

### Aus einem Release (Empfohlen)

Die einfachste Methode: Lade eine fertige Version herunter.

1. Gehe zum [neuesten Release](https://github.com/vizsim/mapillary_image_id_copier_addon/releases/latest)
2. Lade unter **Assets** die ZIP-Datei herunter (z.B. `mapillary_image_id_copier_addon-v0.4.zip`)
3. Entpacke die ZIP-Datei in einen Ordner
4. Öffne Chrome und navigiere zu `chrome://extensions/`
5. Aktiviere den **"Entwicklermodus"** (Schalter oben rechts)
6. Klicke auf **"Entpackte Erweiterung laden"**
7. Wähle den entpackten Ordner aus

Die Extension ist jetzt installiert und einsatzbereit.

### Aus dem Quellcode

Für Entwickler oder wenn du den neuesten Code testen möchtest.

1. Klone das Repository oder lade es als ZIP herunter:
   ```bash
   git clone https://github.com/vizsim/mapillary_image_id_copier_addon.git
   ```
2. Öffne Chrome und navigiere zu `chrome://extensions/`
3. Aktiviere den **"Entwicklermodus"** (Schalter oben rechts)
4. Klicke auf **"Entpackte Erweiterung laden"**
5. Wähle den Projektordner aus

**Hinweis:** Bei Änderungen am Code musst du die Extension in `chrome://extensions/` neu laden (Klick auf das Aktualisieren-Icon).

### Aus dem Chrome Web Store

*Coming soon - Die Erweiterung wird demnächst im Chrome Web Store verfügbar sein.*

## Verwendung

### Voraussetzungen

Um die Funktionalität nutzen zu können, musst du:

1. **Auf Mapillary sein**: Die Erweiterung funktioniert nur auf `mapillary.com`
2. **Traffic Signs aktivieren**: Unter "Map data" musst du die Verkehrszeichen aktivieren

**Option 1 - Alle Verkehrszeichen aktivieren:**
Füge `&trafficSign=all` zur URL hinzu, z.B.:
```
https://www.mapillary.com/app/?pKey=261103190300401&trafficSign=all
```

**Option 2 - Einzelne Verkehrszeichen aktivieren:**
Füge die gewünschten Verkehrszeichen als Parameter hinzu, z.B.:
```
https://www.mapillary.com/app/?pKey=456945498747167&trafficSign[]=regulatory--bicycles-only--g1&trafficSign[]=regulatory--shared-path-pedestrians-and-bicycles--g1
```

### Nutzung

1. Öffne eine Mapillary-Seite mit einem Bild, das Verkehrszeichen enthält (und Traffic Signs aktiviert)
2. Klicke auf das Kamera-Icon der Erweiterung in der Toolbar
3. Die Erweiterung:
   - Kopiert automatisch die Mapillary Image ID und Verkehrszeichen-Informationen in die Zwischenablage
   - Öffnet das OSM Traffic Sign Tool in einem neuen Tab (im Hintergrund)

### Output-Format

Die Erweiterung kopiert folgendes Format in die Zwischenablage:

```
mapillary={image_id}
traffic_sign={verkehrszeichen_code}
traffic_sign:direction=forward
```

**Beispiel:**
```
mapillary=236723128363596
traffic_sign=DE:240
traffic_sign:direction=forward
```

## Berechtigungen

Die Erweiterung benötigt folgende Berechtigungen:

- **`activeTab`**: Zugriff auf den aktiven Tab, nur wenn du auf das Icon klickst
- **`scripting`**: Um Code im Tab auszuführen und Verkehrszeichen zu erkennen
- **`storage`**: Um deine Einstellungen zu speichern

**Datenschutz**: Die Erweiterung verarbeitet alle Daten lokal in deinem Browser. Es werden keine Daten an externe Server gesendet. Die Erweiterung lädt lediglich die öffentliche Index-Datei des Mapillary Sprite-Sheets (`mapillary_sprites.json`), um die Verkehrszeichen-Symbole zuzuordnen. Das ist dieselbe Datei, die auch die Mapillary-Seite selbst lädt.

## Entwicklung

### Projektstruktur

```
mapillary_image_id_copier_addon/
├── manifest.json          # Extension Manifest
├── service-worker.js      # Service Worker (Hauptlogik)
├── options.html           # Options-Seite (HTML)
├── options.js             # Options-Seite (JavaScript)
├── logo.png               # Extension Icon
├── LICENSE                # MIT License
├── README.md              # Diese Datei
├── CHANGELOG.md           # Änderungsprotokoll (Quelle der Release-Notes)
├── RELEASE.md             # Release-Anleitung
├── build-release.sh       # Baut das Release-ZIP
├── .github/workflows/     # GitHub Action: Release bei Versions-Tag
├── releases/              # ZIPs bis v0.3 (neuere unter GitHub Releases)
└── .gitignore             # Git ignore rules
```

### Technische Details

- **Manifest Version**: 3
- **Service Worker**: Läuft im Hintergrund und reagiert auf Icon-Klicks
- **Content Script Injection**: Wird verwendet, um Verkehrszeichen im DOM zu erkennen
- **Erkennung über den Sprite-Index**: Mapillary zeigt Verkehrszeichen als Ausschnitte (CSS `clip`) aus einem Sprite-Sheet. Die Erweiterung ordnet jede Position über die Index-Datei `mapillary_sprites.json` dem Mapillary-Namen zu (z. B. `regulatory--bicycles-only--g1`) und diesen über `TRAFFIC_SIGN_MAPPING` dem OSM-Code. Ordnet Mapillary das Sprite-Sheet neu an, funktioniert die Erkennung deshalb weiter.

### Fehlersuche

Die Erweiterung schreibt Details zur Erkennung in die Konsole des Service Workers: `chrome://extensions/` öffnen, bei der Erweiterung auf **„Service Worker“** klicken und den Tab **Console** wählen. Dort stehen nach jedem Klick die erkannten Mapillary-Namen, der `traffic_sign`-Wert und Zeichen ohne OSM-Zuordnung (`ohneZuordnung`).

## Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## Beitragen

Beiträge sind willkommen! Bitte öffne ein Issue oder einen Pull Request.


