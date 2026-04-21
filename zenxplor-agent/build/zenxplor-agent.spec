# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['../run.py'],
    pathex=['..'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'watchdog.observers.winapi',
        'schedule',
        'requests',
        'requests.adapters',
        'requests.auth',
        'requests.cookies',
        'requests.exceptions',
        'requests.models',
        'requests.sessions',
        'requests.structures',
        'urllib3',
        'urllib3.contrib',
        'certifi',
        'charset_normalizer',
        'idna',
        'winreg',
    ],
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
    console=False,        # no terminal window (use --debug flag at runtime to see output)
    icon=None,
)
