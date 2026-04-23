import os
import sys
import subprocess
import datetime
import ipaddress
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Import path from constants
from .constants import APP_DATA_DIR

CERT_DIR  = Path(APP_DATA_DIR) / "certs"
CERT_FILE = CERT_DIR / "cert.pem"
KEY_FILE  = CERT_DIR / "key.pem"


def certs_exist() -> bool:
    """Return True if both cert and key files are present on disk."""
    return CERT_FILE.exists() and KEY_FILE.exists()


def generate_cert() -> tuple[str, str]:
    """
    Generate a self-signed TLS certificate for 127.0.0.1 / localhost,
    valid for 10 years, and install it into the Windows current-user
    Trusted Root store so Chrome trusts it without a warning.

    Returns (cert_path, key_path) as strings.
    Raises if cryptography library is missing or cert generation fails.
    """
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    CERT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Generating self-signed TLS certificate for localhost...")

    # Generate 2048-bit RSA private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME,        "ZenXplor Local Agent"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME,  "ZenXplor"),
        x509.NameAttribute(NameOID.COUNTRY_NAME,       "US"),
    ])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.utcnow())
        .not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=3650)
        )
        .add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.DNSName("127.0.0.1"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
            ]),
            critical=False,
        )
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=None),
            critical=True,
        )
        .sign(private_key, hashes.SHA256())
    )

    # Write PEM files
    CERT_FILE.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    KEY_FILE.write_bytes(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    logger.info(f"Certificate written to {CERT_FILE}")
    logger.info(f"Private key written to {KEY_FILE}")

    # Install into Windows current-user Trusted Root store
    # certutil -user requires no elevation (UAC prompt)
    if sys.platform == "win32":
        _install_cert_windows()

    return str(CERT_FILE), str(KEY_FILE)


def _install_cert_windows() -> None:
    """
    Install the certificate into Windows current-user Trusted Root store.
    Uses certutil which ships with every modern Windows install.
    The -user flag means no UAC / elevation required.
    """
    try:
        result = subprocess.run(
            ["certutil", "-user", "-addstore", "-f", "Root", str(CERT_FILE)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            logger.info("Certificate installed into Windows Trusted Root store.")
        else:
            logger.warning(
                f"certutil returned non-zero ({result.returncode}): {result.stderr.strip()}"
            )
    except FileNotFoundError:
        logger.error("certutil not found — certificate not installed into trust store.")
    except subprocess.TimeoutExpired:
        logger.error("certutil timed out — certificate not installed into trust store.")
    except Exception as e:
        logger.error(f"Failed to install certificate: {e}")


def get_or_create_cert() -> tuple[str, str]:
    """
    Return (cert_path, key_path).
    Generates and installs the cert if it does not exist yet.
    This is the only function main.py should call.
    """
    if not certs_exist():
        logger.info("No certificate found — generating now.")
        return generate_cert()

    logger.info("Existing certificate found — reusing.")
    return str(CERT_FILE), str(KEY_FILE)
