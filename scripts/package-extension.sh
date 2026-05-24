#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_NAME="highlighter-chrome.zip"

if [ -t 1 ]; then
  BLUE="$(printf '\033[34m')"
  GREEN="$(printf '\033[32m')"
  YELLOW="$(printf '\033[33m')"
  BOLD="$(printf '\033[1m')"
  RESET="$(printf '\033[0m')"
else
  BLUE=""
  GREEN=""
  YELLOW=""
  BOLD=""
  RESET=""
fi

step() {
  printf '%s%s==>%s %s\n' "$BOLD" "$BLUE" "$RESET" "$1"
}

success() {
  printf '%s%s✓%s %s\n' "$GREEN" "$BOLD" "$RESET" "$1"
}

note() {
  printf '%s%s•%s %s\n' "$YELLOW" "$BOLD" "$RESET" "$1"
}

cd "$ROOT_DIR"

step "Building extension runtime"
npm run build
success "Runtime files are current"

step "Writing Chrome package"
rm -f "$ZIP_NAME"
COPYFILE_DISABLE=1 zip -q -r "$ZIP_NAME" \
  manifest.json \
  dist \
  assets/icon-16.png \
  assets/icon-32.png \
  assets/icon-48.png \
  assets/icon-128.png
success "Created $ZIP_NAME"

note "Package contents"
unzip -l "$ZIP_NAME"
