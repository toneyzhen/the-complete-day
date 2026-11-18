#!/usr/bin/env python3
"""Build index.html from src/app.template.html + data/foods.json.

The app is a single self-contained HTML file: the food database is inlined as JSON so the
page works from file:// or any static host with no server.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).parent
data = json.loads((ROOT / "data/foods.json").read_text())
page = (ROOT / "src/app.template.html").read_text()
page = (page.replace("/*__DATA__*/", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
            .replace("__NFOODS__", str(len(data["foods"]))))
(ROOT / "index.html").write_text(page)
print(f"index.html built: {len(data['foods'])} foods, {len(page):,} bytes")
