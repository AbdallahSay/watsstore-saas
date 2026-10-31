"""Rotate configured production secrets using existing authorized FTPS access.

No secret values are printed. Backups are encrypted with Windows DPAPI. This is
credential maintenance only; it does not publish application binaries or schema.
"""
import argparse
import ctypes
import ftplib
import io
import json
import os
from pathlib import Path
import re
import secrets
import ssl
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent

def protect(data: bytes) -> bytes:
    class Blob(ctypes.Structure):
        _fields_ = [('length', ctypes.c_uint32), ('data', ctypes.POINTER(ctypes.c_ubyte))]
    buf = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_ubyte)))
    target = Blob()
    if not ctypes.windll.crypt32.CryptProtectData(ctypes.byref(source), 'WatsStore secrets', None, None, None, 0, ctypes.byref(target)):
        raise RuntimeError('DPAPI encryption failed')
    result = ctypes.string_at(target.data, target.length)
    ctypes.windll.kernel32.LocalFree(target.data)
    return result

def status(key):
    req = urllib.request.Request('https://watsstore.runasp.net/api/admin/stats', headers={'X-Admin-Key':key})
    try:
        with urllib.request.urlopen(req, timeout=25) as res:
            return res.status
    except urllib.error.HTTPError as error:
        return error.code

def main(apply):
    text = (ROOT / 'deploy_monsterasp.ps1').read_text(encoding='utf-8-sig')
    def value(name):
        return re.search(r'\$' + name + r'\s*=\s*"([^"]+)"', text).group(1)
    from urllib.parse import urlparse
    url = urlparse(value('RemoteBaseUrl'))
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=45) as ftp:
        ftp.connect(url.hostname)
        ftp.login(value('Username'), value('Password'))
        ftp.prot_p()
        ftp.cwd(url.path)
        def read(name):
            buffer = io.BytesIO()
            ftp.retrbinary('RETR ' + name, buffer.write)
            return buffer.getvalue()
        raw = read('appsettings.Production.json')
        web = read('web.config')
        config = json.loads(raw.decode('utf-8-sig'))
        if not apply:
            print('Verified production JSON and IIS config via FTPS; no mutation.')
            return
        backup = Path(os.environ['LOCALAPPDATA']) / 'WatsStore' / 'security'
        backup.mkdir(parents=True, exist_ok=True)
        (backup / 'production-before.dpapi').write_bytes(protect(raw))
        old_key = config['AdminSettings']['SecretKey']
        config['Jwt']['SecretKey'] = secrets.token_urlsafe(64)
        config['AdminSettings']['SecretKey'] = secrets.token_urlsafe(48)
        config['AdminSettings']['Password'] = secrets.token_urlsafe(36)
        payload = json.dumps(config, ensure_ascii=False, indent=2).encode('utf-8')
        (backup / 'production-rotated.dpapi').write_bytes(protect(payload))
        ftp.storbinary('STOR appsettings.Production.json', io.BytesIO(payload))
        ftp.storbinary('STOR web.config', io.BytesIO(web))
    for _ in range(6):
        time.sleep(3)
        if status(old_key) in (401,403) and status(config['AdminSettings']['SecretKey']) == 200:
            (ROOT / 'backend/appsettings.Production.json').write_bytes(payload)
            print('ROTATION VERIFIED: historical admin key rejected; new key accepted. JWT and config password rotated. Encrypted local backup retained.')
            return
    raise RuntimeError('Credential revocation not verified; release remains blocked. Do not restore compromised credentials.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    try:
        main(args.apply)
    except Exception as error:
        # Exception strings from network libraries can contain credentials or configuration.
        print('Rotation stopped safely:', type(error).__name__, '(no secret values logged)')
        raise SystemExit(1)
