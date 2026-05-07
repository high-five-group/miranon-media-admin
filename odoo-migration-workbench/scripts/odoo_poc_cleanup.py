#!/usr/bin/env python3
"""Dry-run scaffold for future Odoo POC cleanup by ODOO_POC_LABEL."""

from __future__ import annotations

import argparse
import os


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    label = os.environ.get("ODOO_POC_LABEL")
    if not label:
        print("Blocked: ODOO_POC_LABEL is required even for meaningful dry-run.")
        return 2
    print(f"Would search only for records with exact POC label: {label!r}")
    if not args.execute:
        print("Dry-run only. No records deleted.")
        return 0
    if os.environ.get("ODOO_TARGET_MODE") != "test" or os.environ.get("ODOO_ALLOW_WRITES") != "true":
        print("Blocked: execute cleanup requires ODOO_TARGET_MODE=test and ODOO_ALLOW_WRITES=true.")
        return 2
    print("Blocked: cleanup execute is disabled until created IDs/search domains are verified.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
