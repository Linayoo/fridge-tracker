#!/usr/bin/env python3
"""
Fallback requirements.txt generator for environments where poetry-plugin-export
is unavailable (e.g. Homebrew-managed Poetry installations).

Reads pyproject.toml and poetry.lock from backend/ and writes a pip-compatible
requirements.txt with every pinned production dependency.

Usage:
    python3 scripts/export_requirements.py   # run from backend/
    make requirements                        # tries poetry export first, then this script
"""

from __future__ import annotations

import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).parent.parent  # backend/


def _transitive(seed: set[str], packages: list[dict]) -> set[str]:
    """BFS from seed package names through poetry.lock dependency graph."""
    dep_map: dict[str, set[str]] = {
        p["name"].lower(): {d.lower() for d in (p.get("dependencies") or {})} for p in packages
    }
    visited: set[str] = set()
    queue = list(seed)
    while queue:
        name = queue.pop().lower()
        if name in visited:
            continue
        visited.add(name)
        queue.extend(dep_map.get(name, set()) - visited)
    return visited


def main() -> None:
    pyproject_path = ROOT / "pyproject.toml"
    lock_path = ROOT / "poetry.lock"

    if not pyproject_path.exists():
        sys.exit(f"error: {pyproject_path} not found — run from backend/")
    if not lock_path.exists():
        sys.exit(f"error: {lock_path} not found — run `poetry install` first")

    with pyproject_path.open("rb") as fh:
        proj = tomllib.load(fh)
    with lock_path.open("rb") as fh:
        lock = tomllib.load(fh)

    # Seed with direct production deps (skip the "python" entry itself).
    direct = {k.lower() for k in proj["tool"]["poetry"]["dependencies"] if k.lower() != "python"}
    all_prod = _transitive(direct, lock["package"])

    lines = sorted(
        f"{p['name']}=={p['version']}" for p in lock["package"] if p["name"].lower() in all_prod
    )

    out = ROOT / "requirements.txt"
    header = (
        "# Auto-generated from poetry.lock — do not edit by hand.\n"
        "# Regenerate: make requirements\n"
        "#   (uses poetry-plugin-export if installed, otherwise scripts/export_requirements.py)\n"
    )
    out.write_text(header + "\n".join(lines) + "\n")
    print(f"wrote {len(lines)} packages to {out.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
