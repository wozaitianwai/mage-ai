#!/usr/bin/env bash
set -euo pipefail

# Build Mage AI as a Python package (wheel + source distribution).
# Usage: bash scripts/build_package.sh
# Optional env vars:
#   PYTHON: Python interpreter to use (default: python)
#   DIST_DIR: destination directory for artifacts (default: dist/ under repo root)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON:-python}"
DIST_DIR="${DIST_DIR:-${ROOT_DIR}/dist}"

cd "${ROOT_DIR}"

if [ -d "${DIST_DIR}" ]; then
  rm -rf "${DIST_DIR}"
fi
mkdir -p "${DIST_DIR}"

# Prefer the PEP 517 build module when available; fall back to setup.py otherwise.
if "${PYTHON_BIN}" -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('build') else 1)" >/dev/null 2>&1; then
  echo "Using python -m build to generate sdist and wheel..."
  "${PYTHON_BIN}" -m build --sdist --wheel --outdir "${DIST_DIR}"
else
  echo "build module not found; falling back to setup.py sdist bdist_wheel..."
  "${PYTHON_BIN}" setup.py sdist bdist_wheel --dist-dir "${DIST_DIR}"
fi

echo "Artifacts generated in ${DIST_DIR}"
