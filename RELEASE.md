# Release-Anleitung

Releases entstehen automatisch über GitHub Actions, sobald ein Versions-Tag (`v0.5`, `v1.0`, …) gepusht wird.

## Ablauf

1. **Version anheben** in `manifest.json`, z. B. `"version": "0.5"`.
2. **CHANGELOG.md ergänzen**: neuer Abschnitt `## [0.5] - JJJJ-MM-TT`. Dieser Abschnitt wird zu den Release-Notes.
3. **Lokal testen**: In `chrome://extensions/` den Projektordner als entpackte Erweiterung laden und durchklicken (Details zur Erkennung in der Konsole des Service Workers, siehe README → „Fehlersuche“).
4. **Committen und pushen**:

   ```bash
   git commit -am "release 0.5"
   git push
   ```

5. **Tag setzen und pushen**:

   ```bash
   git tag v0.5
   git push origin v0.5
   ```

Der Workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) prüft dann, ob der Tag zur Version in `manifest.json` passt, liest die Release-Notes aus `CHANGELOG.md`, baut das ZIP mit `build-release.sh` und legt das Release unter [GitHub Releases](https://github.com/vizsim/mapillary_image_id_copier_addon/releases) an.

## Wenn der Workflow fehlschlägt

Den Grund zeigt der Tab **Actions** auf GitHub. Typisch sind ein Tag, der nicht zur Version in `manifest.json` passt, oder ein fehlender Abschnitt in `CHANGELOG.md`. Dann den Tag löschen, den Fehler beheben und den Tag neu setzen:

```bash
git tag -d v0.5
git push origin :refs/tags/v0.5
```

## ZIP lokal bauen

```bash
./build-release.sh
```

Das ZIP landet in `releases/` und wird von Git ignoriert. Die ZIPs bis v0.3 liegen noch im Repository, neuere gibt es nur unter GitHub Releases.

Inhalt des ZIPs: `manifest.json`, `service-worker.js`, `options.html`, `options.js`, `logo.png`, `LICENSE`, `README.md`.
