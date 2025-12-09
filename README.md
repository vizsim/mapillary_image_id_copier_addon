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
| DE:237 | Radweg | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_237.36e48b6d.svg" width="40"> | `regulatory--bicycles-only--g1` |
| DE:240 | Gemeinsamer Geh- und Radweg | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_240.c2d222a0.svg" width="40"> | `regulatory--shared-path-pedestrians-and-bicycles--g1` |
| DE:241-30 | Getrennter Rad- und Gehweg (Radweg links) | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_241_30.69c98777.svg" width="40"> | `regulatory--dual-path-bicycles-and-pedestrians--g1` |
| DE:241-31 | Getrennter Rad- und Gehweg (Radweg rechts) | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_241_31.3627eb18.svg" width="40"> | `regulatory--dual-path-pedestrians-and-bicycles--g1` |
| DE:239 | Gehweg | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_239.d408d2f3.svg" width="40"> | `regulatory--pedestrians-only--g1` |
| DE:1022-10 | Radfahrer frei | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_1022_10.cda7bd53.svg" width="40"> | `complementary--except-bicycles--g1` |
| DE:239,1022-10 | Gehweg mit Radfahrer frei | <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_239.d408d2f3.svg" width="40"> + <img src="https://trafficsigns.osm-verkehrswende.org/_next/static/media/DE_1022_10.cda7bd53.svg" width="40"> | `regulatory--pedestrians-only--g1`<br>`complementary--except-bicycles--g1` |

## Installation

### Aus einem Release (Empfohlen)

Die einfachste Methode: Lade eine fertige Version herunter.

1. Gehe zu den [Releases](https://github.com/vizsim/mapillary_image_id_copier_addon/tree/main/releases)
2. Lade die neueste Version als ZIP-Datei herunter (z.B. `mapillary_image_id_copier_addon-v0.2.zip`)
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
- **`tabs`**: Um das Traffic Sign Tool in einem neuen Tab zu öffnen

**Datenschutz**: Die Erweiterung verarbeitet alle Daten lokal in deinem Browser. Es werden keine Daten an externe Server gesendet.

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
├── CHANGELOG.md           # Änderungsprotokoll
├── releases/              # Build-Artefakte (ZIP-Dateien)
└── .gitignore            # Git ignore rules
```

### Technische Details

- **Manifest Version**: 3
- **Service Worker**: Läuft im Hintergrund und reagiert auf Icon-Klicks
- **Content Script Injection**: Wird verwendet, um Verkehrszeichen im DOM zu erkennen

## Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## Beitragen

Beiträge sind willkommen! Bitte öffne ein Issue oder einen Pull Request.


