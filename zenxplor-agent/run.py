"""
run.py — top-level entry point for PyInstaller.

This file lives outside the `agent` package so that PyInstaller
bundles it as __main__.  Relative imports inside `agent/` then work
correctly because `agent` is treated as a proper package.
"""

from agent.main import main

if __name__ == "__main__":
    main()
