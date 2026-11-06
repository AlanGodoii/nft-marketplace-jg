"""Optional asset reproduction: python scripts/extract-home-assets.py junglegaming.zip.
Requires Pillow; not a dependency of npm install/build or application execution.
Only known, explicitly supplied PNG art rectangles are read. No ZIP extraction.
"""
import hashlib
import io
import json
from pathlib import Path
import sys
from zipfile import ZipFile
from PIL import Image

output = Path(__file__).resolve().parent.parent / 'public/assets/figma/home'
manifest = json.loads((output / 'manifest.json').read_text())
if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/extract-home-assets.py junglegaming.zip')
with ZipFile(sys.argv[1]) as archive:
    for asset in manifest:
        content = archive.read(asset['source'])
        if hashlib.sha256(content).hexdigest() != asset['sourceSha256']:
            raise SystemExit('Unexpected source PNG: ' + asset['source'])
        image = Image.open(io.BytesIO(content)).crop(tuple(asset['crop']))
        if list(image.size) != asset['dimensions']:
            raise SystemExit('Unexpected crop dimensions')
        target = output / asset['file']
        image.save(target, 'WEBP', quality=92, method=6)
        print(f'{target.name}: {image.width}x{image.height}, {target.stat().st_size} bytes')
