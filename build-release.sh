#!/bin/bash
# Build-Script für Chrome Extension Release
# Erstellt ein ZIP-Archiv mit allen notwendigen Dateien

set -e

# Variablen
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
EXTENSION_NAME="mapillary_image_id_copier_addon"
RELEASE_DIR="release"
RELEASES_DIR="releases"
ZIP_NAME="${EXTENSION_NAME}-v${VERSION}.zip"
ZIP_PATH="${RELEASES_DIR}/${ZIP_NAME}"

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building release for version ${VERSION}...${NC}"

# Alte Release-Dateien löschen
rm -rf "${RELEASE_DIR}"

# Releases-Verzeichnis erstellen (für fertige ZIPs)
mkdir -p "${RELEASES_DIR}"
rm -f "${ZIP_PATH}"

# Release-Verzeichnis erstellen (temporär für ZIP-Erstellung)
mkdir -p "${RELEASE_DIR}"

# Dateien kopieren (nur die, die für die Extension benötigt werden)
echo "Copying files..."
FILES=(manifest.json popup.html popup.js options.html options.js lib logo.png LICENSE README.md)
cp -r "${FILES[@]}" "${RELEASE_DIR}/"

# ZIP erstellen
echo "Creating ZIP archive..."
cd "${RELEASE_DIR}"

# Prüfe, welches Tool verfügbar ist
if command -v zip &> /dev/null; then
    # zip ist verfügbar
    zip -r "../${ZIP_PATH}" . -x "*.DS_Store" -x "*__MACOSX*"
elif command -v python3 &> /dev/null; then
    # Python als Fallback
    python3 -c "
import os
import zipfile

zip_name = '../${ZIP_PATH}'
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        for f in files:
            if '.DS_Store' not in f and '__MACOSX' not in root:
                file_path = os.path.join(root, f)
                arcname = os.path.relpath(file_path, '.')
                z.write(file_path, arcname)
print(f'ZIP created: {zip_name}')
"
else
    echo -e "${RED}Error: Neither 'zip' nor 'python3' is available.${NC}"
    echo "Please install zip: sudo apt-get install zip"
    echo "Or install python3: sudo apt-get install python3"
    cd ..
    rm -rf "${RELEASE_DIR}"
    exit 1
fi

cd ..

# Cleanup
rm -rf "${RELEASE_DIR}"

echo -e "${GREEN}✓ Release created: ${ZIP_PATH}${NC}"
echo ""
echo "Next steps:"
echo "1. Test: unzip ${ZIP_PATH} and load the folder via chrome://extensions/ (Load unpacked)"
echo "2. Publish: push the tag, GitHub Actions builds the ZIP and creates the release (see RELEASE.md):"
echo "   git tag v${VERSION} && git push origin v${VERSION}"
echo ""

