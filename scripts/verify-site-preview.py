"""Validate the partial Leptos artifact using only Python's standard library."""

from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "target/site-preview"
RUNTIME_EXTENSIONS = {".html", ".css", ".js", ".mjs", ".json", ".wasm", ".png", ".svg", ".webp", ".ico"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def files_under(directory):
    require(directory.is_dir(), f"Missing directory: {directory}")
    require(not directory.is_symlink(), f"Symlink directory: {directory}")
    files = set()
    for path in directory.rglob("*"):
        require(not path.is_symlink(), f"Symlink in artifact/source: {path}")
        if path.is_file():
            files.add(path.relative_to(directory))
        else:
            require(path.is_dir(), f"Nonregular file: {path}")
    return files


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = set()
        self.resources = []
        self.runtime = False

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag)
        attrs = dict(attrs)
        if "src" in attrs:
            self.resources.append(attrs["src"])
        if tag == "link" and "href" in attrs:
            self.resources.append(attrs["href"])
        if tag in {"script", "iframe", "object", "embed"}:
            self.runtime = True


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def verify():
    source = ROOT / "docs/cabane"
    legacy = set()
    for path in files_under(source):
        if path.suffix == ".md":
            continue
        require(path.suffix in RUNTIME_EXTENSIONS, f"Unregistered asset: {path}")
        legacy.add(Path("cabane") / path)
    actual = files_under(PREVIEW)
    expected = legacy | {Path("leptos-proof/index.html")}
    require(actual == expected, f"Artifact mismatch: missing={expected - actual}, extra={actual - expected}")
    for path in legacy:
        require((PREVIEW / path).read_bytes() == (ROOT / "docs" / path).read_bytes(), f"Changed legacy bytes: {path}")

    proof = Document()
    proof_html = (PREVIEW / "leptos-proof/index.html").read_text()
    proof.feed(proof_html)
    require(proof_html.lower().startswith("<!doctype html>"), "Missing document doctype")
    require({"html", "head", "title", "body", "main", "h1"} <= proof.tags, "Incomplete proof document")
    require(not proof.runtime and not proof.resources and ".wasm" not in proof_html, "Proof requires client resources")

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(PREVIEW)))
    worker = Thread(target=server.serve_forever, daemon=True)
    worker.start()
    base = f"http://127.0.0.1:{server.server_port}"

    def fetch(address, mime=None):
        with urlopen(address, timeout=10) as response:
            require(response.status == 200, f"Failed route: {address}")
            if mime:
                require(response.headers.get_content_type() == mime, f"Wrong MIME: {address}")
            response.read()

    page_count = 0
    try:
        for path in sorted(actual):
            if path.suffix != ".html":
                continue
            direct = base + "/" + path.as_posix()
            fetch(direct, "text/html")
            page_count += 1
            if path.name == "index.html":
                fetch(direct.removesuffix("index.html"), "text/html")
                page_count += 1
            document = Document()
            document.feed((PREVIEW / path).read_text())
            for resource in document.resources:
                address = urljoin(direct, resource)
                require(urlsplit(address).netloc == urlsplit(base).netloc, f"Unexpected external resource: {address}")
                fetch(address)
        fetch(base + "/cabane/memory/game.wasm", "application/wasm")
    finally:
        server.shutdown()
        server.server_close()
        worker.join()
    print(f"Verified {len(legacy)} unchanged Cabane files, {page_count} page URLs, local resources and static proof.")


if __name__ == "__main__":
    verify()
