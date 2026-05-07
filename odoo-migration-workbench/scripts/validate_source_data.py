#!/usr/bin/env python3
"""Validate local Airtable/source exports without external writes."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default="odoo-migration-workbench/source-exports")
    args = parser.parse_args()
    root = Path(args.path)
    if not root.exists():
        print(f"Blocked: {root} does not exist. Add CSV/JSON exports there.")
        return 2
    for file in sorted(root.glob("*")):
        if file.suffix.lower() == ".csv":
            with file.open(newline="", encoding="utf-8-sig") as fh:
                reader = csv.reader(fh)
                header = next(reader, [])
                rows = sum(1 for _ in reader)
            print(f"CSV {file}: columns={len(header)} rows={rows}")
        elif file.suffix.lower() == ".json":
            with file.open(encoding="utf-8") as fh:
                data = json.load(fh)
            print(f"JSON {file}: type={type(data).__name__}")
        else:
            print(f"Skip {file}: unsupported suffix")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
