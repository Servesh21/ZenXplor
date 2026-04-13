# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['../run.py'],
    pathex=['..'],
    binaries=[],
    datas=[],
    hiddenimports=['watchdog.observers.winapi'],
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'PIL'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='zenxplor-agent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,        # no terminal window
    icon=None,
)
