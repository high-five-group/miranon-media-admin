#!/usr/bin/env python3
"""Read-only Odoo JSON-2 inspection helper.

Requires Odoo 19 JSON-2 API access. Never prints secrets and never writes.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def env_presence() -> dict[str, bool]:
    return {name: bool(os.environ.get(name)) for name in ["ODOO_URL", "ODOO_DB", "ODOO_USERNAME", "ODOO_API_KEY"]}


def post_json(url: str, api_key: str, db: str | None, model: str, method: str, payload: dict) -> object:
    endpoint = f"{url.rstrip('/')}/json/2/{model}/{method}"
    headers = {
        "Authorization": f"bearer {api_key}",
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "miranon-odoo-readonly-inspector",
    }
    if db:
        headers["X-Odoo-Database"] = db
    req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect Odoo models read-only via JSON-2.")
    parser.add_argument("--models", nargs="+", default=["event.event", "event.registration", "event.event.ticket", "event.question", "event.registration.answer"])
    parser.add_argument("--limit", type=int, default=1)
    args = parser.parse_args()

    presence = env_presence()
    print("Env presence:", {k: ("present" if v else "missing") for k, v in presence.items()})
    if not presence["ODOO_URL"] or not presence["ODOO_API_KEY"]:
        print("Blocked: ODOO_URL and ODOO_API_KEY are required for read-only inspection.")
        return 2

    url = os.environ["ODOO_URL"]
    api_key = os.environ["ODOO_API_KEY"]
    db = os.environ.get("ODOO_DB") or None

    output: dict[str, object] = {"models": {}}
    for model in args.models:
        try:
            fields_info = post_json(url, api_key, db, model, "fields_get", {"attributes": ["string", "type", "required", "readonly", "relation"]})
            sample = post_json(url, api_key, db, model, "search_read", {"domain": [], "fields": ["id"], "limit": args.limit})
            output["models"][model] = {"fields_get": fields_info, "sample": sample}
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            output["models"][model] = {"error": f"HTTP {exc.code}", "body": body[:1000]}
        except Exception as exc:  # noqa: BLE001 - CLI report only
            output["models"][model] = {"error": type(exc).__name__, "message": str(exc)}

    print(json.dumps(output, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
