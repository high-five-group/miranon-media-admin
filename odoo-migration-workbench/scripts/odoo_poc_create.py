#!/usr/bin/env python3
"""Dry-run scaffold for future Odoo POC creation.

Execute mode intentionally stops until instance fields are verified.
"""

from __future__ import annotations

import argparse
import os


REQUIRED_EXEC_ENV = ["ODOO_URL", "ODOO_USERNAME", "ODOO_API_KEY", "ODOO_TARGET_MODE", "ODOO_ALLOW_WRITES", "ODOO_POC_LABEL"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Attempt write mode after gates pass.")
    args = parser.parse_args()

    print("Planned POC objects: 1 fake contact, 1 fake event, optional free ticket, 1 fake registration.")
    print("No invoices, payments, SMS, webhooks or real customer mail.")

    if not args.execute:
        print("Dry-run only. No external writes.")
        return 0

    missing = [name for name in REQUIRED_EXEC_ENV if not os.environ.get(name)]
    if missing:
        print(f"Blocked: missing env vars: {', '.join(missing)}")
        return 2
    if os.environ.get("ODOO_TARGET_MODE") != "test" or os.environ.get("ODOO_ALLOW_WRITES") != "true":
        print("Blocked: execute requires ODOO_TARGET_MODE=test and ODOO_ALLOW_WRITES=true.")
        return 2

    print("Blocked: execute is disabled until Odoo model/field inventory is instance-verified.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
