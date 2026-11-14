# Mapillary Traffic Sign & Image ID Copier

Chrome-Erweiterung für OSM-Mapper\*innen: Ein Klick kopiert die Bild-ID und die erkannten Verkehrszeichen des aktuellen Mapillary-Bildes als fertige OSM-Tags.

```text
mapillary=261103190300401
traffic_sign=DE:240,1000-31
traffic_sign:direction=forward
```

## Installation

- **[Chrome Web Store](https://chromewebstore.google.com/detail/mapillary-traffic-sign-im/eagencdgcmgechomeedlbkhfcihdjhdg)** (empfohlen, Updates kommen automatisch)
- **ZIP:** aus dem [neuesten Release](https://github.com/vizsim/mapillary_image_id_copier_addon/releases/latest) herunterladen und entpacken, in `chrome://extensions/` den Entwicklermodus einschalten und „Entpackte Erweiterung laden“ wählen.

## Verwendung

1. Auf mapillary.com ein Bild öffnen.
2. Auf das Icon klicken. Das Popup kopiert sofort und zeigt, was erkannt wurde. Dort kannst du die Richtung (forward/backward) umschalten, einzelne Zeichen abwählen und Zeichen ohne Zuordnung direkt einem OSM-Code zuordnen.
3. Auf Wunsch öffnet sich das [OSM Traffic Sign Tool](https://trafficsigns.osm-verkehrswende.org/) mit der erkannten Kombination.

Haupt- und Zusatzzeichen werden automatisch kombiniert, z. B. `traffic_sign=DE:239,1022-10`.

**Wichtig:** Mapillary blendet nur Zeichen ein, die im Verkehrszeichen-Filter stehen, und nur die kann die Erweiterung erkennen. Fehlen aktive Zeichen im Filter, ergänzt das Popup sie mit **Filter ergänzen** in der URL. Mit **Alle Zeichen einblenden** siehst du auch Zeichen, die du noch nicht zugeordnet hast.

## Verkehrszeichen

Alle Pakete sind standardmäßig aktiv. In den Einstellungen kannst du Pakete und einzelne Zeichen ausschalten: Das Popup erkennt sie dann weiterhin, übernimmt sie aber erst per Haken. Außerdem kannst du eigene Zuordnungen für alle rund 1.500 Verkehrszeichen-Klassen von Mapillary anlegen, die Vorrang vor den Paketen haben.

### Radverkehr

| | Code | Bedeutung |
| :-: | --- | --- |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_237.svg" width="40" alt="DE:237"> | DE:237 | Radweg |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_239.svg" width="40" alt="DE:239"> | DE:239 | Gehweg |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_240.svg" width="40" alt="DE:240"> | DE:240 | Gemeinsamer Geh- und Radweg |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_241_30.svg" width="40" alt="DE:241-30"> | DE:241-30 | Getrennter Rad- und Gehweg (Radweg links) |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_241_31.svg" width="40" alt="DE:241-31"> | DE:241-31 | Getrennter Rad- und Gehweg (Radweg rechts) |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_244_2.svg" width="40" alt="DE:244.2"> | DE:244.2 | Ende Fahrradstraße |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1022_10.svg" width="40" alt="DE:1022-10"> | DE:1022-10 | Zusatzzeichen: Radfahrer frei |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_31.svg" width="40" alt="DE:1000-31"> | DE:1000-31 | Zusatzzeichen: beide Richtungen |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_1000_33.svg" width="40" alt="DE:1000-33"> | DE:1000-33 | Zusatzzeichen: Radverkehr im Gegenverkehr |

### Zufahrtsverbote

| | Code | Bedeutung |
| :-: | --- | --- |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_250.svg" width="40" alt="DE:250"> | DE:250 | Verbot für Fahrzeuge aller Art |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_251.svg" width="40" alt="DE:251"> | DE:251 | Verbot für Kraftwagen |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_253.svg" width="40" alt="DE:253"> | DE:253 | Verbot für Kraftfahrzeuge über 3,5 t |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_254.svg" width="40" alt="DE:254"> | DE:254 | Verbot für Radverkehr |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_255.svg" width="40" alt="DE:255"> | DE:255 | Verbot für Krafträder |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_259.svg" width="40" alt="DE:259"> | DE:259 | Verbot für Fußgänger |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_260.svg" width="40" alt="DE:260"> | DE:260 | Verbot für Kraftfahrzeuge |

### Weitere

| | Code | Bedeutung |
| :-: | --- | --- |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_350_10.svg" width="40" alt="DE:350"> | DE:350 | Fußgängerüberweg |
| <img src="https://cdn.jsdelivr.net/npm/@osm-traffic-signs/converter@0.6.0/dist/data-svgs/DE/svgs/DE_274_30.svg" width="40" alt="DE:274-30"> | DE:274-30 | Zulässige Höchstgeschwindigkeit 30 |

## Berechtigungen und Datenschutz

- `activeTab` und `scripting`: die Mapillary-Seite lesen, wenn du auf das Icon klickst
- `storage`: Einstellungen und eigene Zuordnungen speichern

Alles passiert lokal im Browser. Die Erweiterung lädt nur die öffentlichen Sprite-Dateien von Mapillary (Zeichen-Index und Icons), also dieselben Dateien, die auch die Mapillary-Seite lädt.

## Entwicklung

Den Projektordner in `chrome://extensions/` als entpackte Erweiterung laden und nach Änderungen auf ⟳ klicken. Tests laufen mit `node --test` (Node 22), Releases beschreibt [RELEASE.md](RELEASE.md).

Mapillary zeigt Verkehrszeichen als Ausschnitte (CSS `clip`) aus einem Sprite-Sheet. Die Erweiterung ordnet jede Position über `mapillary_sprites.json` einem Mapillary-Namen zu (z. B. `regulatory--bicycles-only--g1`) und diesen über den Katalog in [lib/catalog.js](lib/catalog.js) einem OSM-Code. Deshalb übersteht die Erkennung Umbauten am Sprite-Sheet. Zur Fehlersuche im Popup rechtsklicken und „Untersuchen“ wählen.

## Lizenz

MIT, siehe [LICENSE](LICENSE). Issues und Pull Requests sind willkommen.
