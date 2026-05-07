#!/usr/bin/env python3
"""Validate generated import package CSV files."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default="odoo-migration-workbench/generated-import-package")
    args = parser.parse_args()
    root = Path(args.path)
    if not root.exists():
        print(f"Blocked: {root} does not exist.")
        return 2
    csv_files = sorted(root.glob("*.csv"))
    if not csv_files:
        print("No CSV import files found. Current package is concept/blockered.")
        return 0
    for file in csv_files:
        with file.open(newline="", encoding="utf-8-sig") as fh:
            reader = csv.reader(fh)
            header = next(reader, [])
            rows = sum(1 for _ in reader)
        if not header:
            print(f"Invalid: {file} has no header")
            return 1
        print(f"OK {file}: columns={len(header)} rows={rows}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
