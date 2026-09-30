"""Validate the partial Leptos artifact using only Python's standard library."""

import html
import json
import posixpath
import tomllib
from datetime import date
import re
import xml.etree.ElementTree as ET
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen
from urllib.error import HTTPError

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
        self.ids = set()
        self.fragments = []
        self.links = []
        self.metadata = {}

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag)
        attrs = dict(attrs)
        if tag == "meta":
            self.metadata[attrs.get("name", attrs.get("property", ""))] = attrs.get("content")
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])
        if "id" in attrs:
            require(attrs["id"] not in self.ids, f"Duplicate id: {attrs['id']}")
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("href", "").startswith("#"):
            self.fragments.append(attrs["href"][1:])
        if "src" in attrs:
            self.resources.append(attrs["src"])
        if tag == "link" and "href" in attrs and attrs.get("rel") != "canonical":
            self.resources.append(attrs["href"])
        if tag in {"iframe", "object", "embed"} or (tag == "script" and attrs.get("type") != "application/ld+json"):
            self.runtime = True
        if (tag == "script" and "src" in attrs) or any(name.startswith("on") for name in attrs):
            self.runtime = True


class QuietHandler(SimpleHTTPRequestHandler):
    # Test-only approximation of Pages custom-404 serving; deployment still needs verification.
    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        body = (PREVIEW / "404.html").read_bytes()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def log_message(self, *_args):
        pass


def verify():
    source = ROOT / "docs/cabane"
    legacy = set()
    for path in files_under(source):
        if path.suffix == ".md" or path == Path("index.html"):
            continue
        require(path.suffix in RUNTIME_EXTENSIONS, f"Unregistered asset: {path}")
        legacy.add(Path("cabane") / path)
    cabane = (PREVIEW / "cabane/index.html").read_text()
    original = (source / "index.html").read_text()
    for route in re.findall(r'href="./([^"#]+/)"', original):
        require(f'href="/cabane/{route}"' in cabane, f"Lost Cabane route: {route}")
    for text in re.findall(r'<(?:h2|p|span)[^>]*>([^<>]+)</(?:h2|p|span)>', original):
        require(html.unescape(text) in html.unescape(cabane), f"Lost Cabane copy: {text}")
    require('id="share"' in cabane and 'id="share-status"' in cabane, "Lost sharing contract")
    require(cabane.count("<script") == 1 and ".wasm" not in cabane, "Unexpected landing runtime")
    index_html = (PREVIEW / "blog/index.html").read_text()
    cutoff_match = re.search(r'data-published-through="([0-9-]+)"', index_html)
    require(cutoff_match, "Missing publication cutoff")
    cutoff = date.fromisoformat(cutoff_match[1])
    blog_pages = {Path("blog/index.html")}
    published = []
    for source_file in sorted((ROOT / "content/blog").glob("*.md")):
        lines = source_file.read_text().splitlines()
        require(lines and lines[0] == "+++", f"Invalid article delimiters: {source_file}")
        end = lines.index("+++", 1)
        meta = tomllib.loads("\n".join(lines[1:end]))
        route = Path("blog") / meta["slug"] / "index.html"
        if not meta.get("draft", True) and meta["date"] <= cutoff:
            blog_pages.add(route)
            published.append((meta, route))
        else:
            require(not (PREVIEW / route).exists(), f"Unpublished article leaked: {route}")
            require(f'/blog/{meta["slug"]}/' not in index_html, "Unpublished listing leaked")
    actual = files_under(PREVIEW)
    home_assets = {Path("images") / name for name in ("profile.webp", "js-icon.webp", "melimo-player.png", "favicon.ico")}
    public_assets = files_under(ROOT / "public")
    expected = {Path("cabane/index.html")} | legacy | home_assets | public_assets | blog_pages | {Path("sitemap.xml"), Path("robots.txt"), Path("CNAME"), Path(".nojekyll"), Path("LICENSE")} | {Path("index.html"), Path("404.html"), Path("leptos-proof/index.html"), Path("assets/main.css"), Path("projects/index.html"), Path("projects/cabane/index.html"), Path("projects/melimo/index.html")}
    require(actual == expected, f"Artifact mismatch: missing={expected - actual}, extra={actual - expected}")
    for path in legacy | home_assets:
        require((PREVIEW / path).read_bytes() == (ROOT / "docs" / path).read_bytes(), f"Changed legacy bytes: {path}")

    require((PREVIEW / "assets/main.css").read_bytes() == (ROOT / "styles/site.css").read_bytes(), "Changed site stylesheet")

    # The copied application keeps its own module graph: every relative import,
    # dynamic import and fetch inside copied scripts must resolve in the artifact.
    module_reference = re.compile(
        r"(?:\bfrom\s+|\bimport\s*\(\s*|\bfetch\s*\(\s*)['\"](\.{1,2}/[^'\"]+)['\"]",
        re.S,
    )
    for path in sorted(p for p in actual if p.suffix in {".js", ".mjs"}):
        script = (PREVIEW / path).read_text()
        for literal in module_reference.findall(script):
            target = posixpath.normpath(
                posixpath.join(posixpath.dirname(path.as_posix()), literal.split("?", 1)[0])
            )
            require(Path(target) in actual, f"Legacy module reference missing: {path} -> {literal}")

    # Le Memory drives its engine through the raw Wasm ABI: the Rust build must
    # import nothing from the host and export every function the controller calls.
    def parse_wasm_boundaries(data):
        def read_leb(buf, offset):
            value = shift = 0
            while True:
                byte = buf[offset]
                offset += 1
                value |= (byte & 0x7F) << shift
                if not byte & 0x80:
                    return value, offset
                shift += 7

        require(data[:8] == b"\x00asm\x01\x00\x00\x00", "Malformed Wasm module header")
        imports = exports = None
        cursor = 8
        while cursor < len(data):
            section, cursor = read_leb(data, cursor)
            size, cursor = read_leb(data, cursor)
            section_end = cursor + size
            require(section_end <= len(data), "Truncated Wasm section")
            if section == 2:
                require(imports is None, "Duplicated Wasm import section")
                imports, offset = read_leb(data, cursor)
                require(imports == 0, f"Memory Wasm must import nothing; got {imports}")
            elif section == 7:
                require(exports is None, "Duplicated Wasm export section")
                exports = []
                count, offset = read_leb(data, cursor)
                for _ in range(count):
                    length, offset = read_leb(data, offset)
                    name = data[offset:offset + length].decode("utf-8")
                    offset += length
                    kind = data[offset]
                    offset += 1
                    # Every export descriptor (func/table/memory/global) is a
                    # name, a one-byte kind and a single index LEB.
                    _, offset = read_leb(data, offset)
                    exports.append(name)
                require(offset <= section_end, "Malformed Wasm export section")
            cursor = section_end
        require(not imports, "Memory Wasm must import nothing (raw ABI)")
        require(exports is not None, "Missing Wasm export section")
        return set(exports)

    wasm_exports = parse_wasm_boundaries((PREVIEW / "cabane/memory/game.wasm").read_bytes())
    require("memory" in wasm_exports, "Memory Wasm must export its linear memory")
    memory_controller = (PREVIEW / "cabane/memory/game.js").read_text()
    engine_calls = set(re.findall(r"\bengine\.(\w+)", memory_controller))
    require(engine_calls, "Memory controller must call the raw Wasm exports")
    missing_abis = engine_calls - wasm_exports
    require(not missing_abis, f"Memory Wasm ABI mismatch: {sorted(missing_abis)}")
    require({"start", "card", "flip", "is_matched", "hide_mismatch"} <= wasm_exports,
            "Memory Wasm is missing a controller export")

    # Both documents must opt in; games and ordinary pages must not participate.
    transition_pages = {
        path for path in actual if path.suffix == ".html"
        and 'href="/assets/page-transition.css"' in (PREVIEW / path).read_text()
    }
    require(transition_pages == {Path("index.html"), Path("cabane/index.html")},
            f"Unexpected transition participants: {transition_pages}")

    # The transition is a pure-CSS contract: exactly two participants, a warm
    # doorway veil between the two pages, no element-level animation, a motion
    # budget, and a reduced-motion opt-out. No script or router is involved.
    transition_css = (PREVIEW / "assets/page-transition.css").read_text()
    require("view-transition-name" not in transition_css,
            "The transition must not animate individual page elements")
    require("::view-transition-group(root)" in transition_css
            and "background: #f4eadb" in transition_css,
            "The root transition must carry the warm doorway veil")
    require("@media (prefers-reduced-motion: reduce)" in transition_css
            and "navigation: none" in transition_css
            and "animation: none !important" in transition_css,
            "Missing reduced-motion opt-out")
    durations = [int(value) for value in re.findall(r"(\d+)ms", transition_css)]
    require(durations and all(value <= 600 for value in durations),
            f"Transition durations exceed the motion budget: {durations}")

    for path in public_assets:
        require((PREVIEW / path).read_bytes() == (ROOT / "public" / path).read_bytes(), f"Changed public asset: {path}")
    css = (PREVIEW / "assets/main.css").read_text()
    require("@import" not in css, "Unexpected external stylesheet import")
    font_urls = re.findall(r"url\(([^)]+)\)", css)
    require(len(font_urls) == 4 and len(set(font_urls)) == 4, "Expected four local font subsets")
    for url in font_urls:
        require(url.startswith("/fonts/inter/"), f"Unexpected font source: {url}")
        require((PREVIEW / url[1:]).read_bytes().startswith(b"wOF2"), f"Invalid WOFF2: {url}")
    require(sum((PREVIEW / url[1:]).stat().st_size for url in font_urls) < 125_000, "Font budget exceeded")
    for path in public_assets:
        if path.suffix == ".svg":
            svg = ET.fromstring((PREVIEW / path).read_text())
            require(svg.attrib.get("viewBox") == "0 0 24 24", "Unexpected icon dimensions")
            require(all(element.tag.rsplit("}", 1)[-1] in {"svg", "path"} for element in svg.iter()), "Unexpected SVG element")
            require(all(not key.startswith("on") and "href" not in key for element in svg.iter() for key in element.attrib), "Active SVG content")

    require((PREVIEW / "CNAME").read_bytes() == (ROOT / "docs/CNAME").read_bytes(), "Changed custom domain")
    require((PREVIEW / "CNAME").read_text().strip() == "www.somsouk.fr", "Wrong domain")
    require((PREVIEW / "LICENSE").read_bytes() == (ROOT / "docs/LICENSE").read_bytes(), "Changed site license")
    require(b"GENERAL PUBLIC LICENSE" in (PREVIEW / "LICENSE").read_bytes(), "Missing GPL notice")
    require((PREVIEW / ".nojekyll").read_bytes() == b"", "Invalid static hosting marker")
    sitemap = ET.fromstring((PREVIEW / "sitemap.xml").read_text())
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    require(sitemap.tag == ns + "urlset", "Wrong sitemap namespace")
    locations = [node.text for node in sitemap.findall(ns + "url/" + ns + "loc")]
    expected_locations = set()
    for path in actual:
        if path.suffix != ".html" or path in {Path("404.html"), Path("leptos-proof/index.html")}:
            continue
        url = path.as_posix()
        if path.name == "index.html":
            url = url.removesuffix("index.html")
        expected_locations.add("https://www.somsouk.fr/" + url)
    require(len(locations) == len(set(locations)) and set(locations) == expected_locations, "Wrong sitemap routes or duplicate aliases")
    require((PREVIEW / "robots.txt").read_text() == "User-agent: *\nAllow: /\n\nSitemap: https://www.somsouk.fr/sitemap.xml\n", "Wrong robots policy")

    proof = Document()
    proof_html = (PREVIEW / "leptos-proof/index.html").read_text()
    proof.feed(proof_html)
    require(proof_html.lower().startswith("<!doctype html>"), "Missing document doctype")
    require({"html", "head", "title", "body", "header", "footer", "nav", "main", "h1"} <= proof.tags, "Incomplete proof document")
    require(all(fragment in proof.ids for fragment in proof.fragments), "Broken proof anchor or skip link")
    require(not proof.runtime and proof.resources == ["/assets/main.css", "/images/favicon.ico"] and ".wasm" not in proof_html, "Unexpected proof client resources")

    home = Document()
    home_html = (PREVIEW / "index.html").read_text()
    home.feed(home_html)
    require(not home.runtime and ".wasm" not in home_html, "Homepage must render without a client runtime")
    require(home_html.count('class="profile-icon-link"') == 4, "Missing profile icon links")
    require('href="/cabane/" title="La cabane à découvertes"' in home_html,
            "Cabane icon must stay on the current origin")
    require('href="https://www.somsouk.fr/cabane/"' not in home_html,
            "Cabane navigation escaped to production")
    require(home_html.count('class="profile-icon-label"') == 4, "Missing accessible icon labels")
    require(home_html.count("<h1>") == 1, "Homepage requires one primary heading")
    require({"about-me", "things-i-m-building", "personal-projects", "melimo-title", "cabane-title",
             "experience", "doctolib", "blablacar", "streamroot-lumen", "happn", "education", "epita",
             "a-little-more-about-me"} <= home.ids, "Missing legacy homepage anchor")
    require(all(fragment in home.ids for fragment in home.fragments), "Broken homepage anchor")
    require('href="https://www.somsouk.fr/"' in home_html, "Missing HTTPS canonical")

    for name, value in {"description": "Software engineer at Doctolib building healthcare software, and developing side projects on the web.", "og:title": "Software engineer",
                        "og:url": "https://www.somsouk.fr/", "twitter:card": "summary"}.items():
        require(home.metadata.get(name) == value, f"Wrong homepage metadata: {name}")
    structured = re.findall(r'<script type="application/ld\+json">(.*?)</script>', home_html, re.S)
    require(len(structured) == 1, "Missing or duplicated structured metadata")
    require(json.loads(structured[0])["url"] == "https://www.somsouk.fr/", "Wrong structured canonical")
    for href in home.links:
        address = urlsplit(href)
        if address.scheme or address.netloc or not address.path:
            continue
        destination = address.path.lstrip("/")
        if address.path.endswith("/"):
            destination += "index.html"
        require(Path(destination) in actual, f"Broken local homepage link: {href}")

    require("/projects/" in home.links, "Homepage must expose project index")
    for route in ["projects", "projects/cabane", "projects/melimo"]:
        page_html = (PREVIEW / route / "index.html").read_text()
        page = Document()
        page.feed(page_html)
        require(not page.runtime and ".wasm" not in page_html, f"Unexpected project runtime: {route}")
        require(f'href="https://www.somsouk.fr/{route}/"' in page_html, f"Wrong project canonical: {route}")
        require(page.metadata.get("description") and page.metadata.get("og:title"), f"Missing project metadata: {route}")
        require(all(fragment in page.ids for fragment in page.fragments), f"Broken project anchor: {route}")
        for href in page.links:
            address = urlsplit(href)
            if address.scheme or address.netloc or not address.path:
                continue
            path = address.path.lstrip("/") + ("index.html" if address.path.endswith("/") else "")
            require(Path(path) in actual, f"Broken project link: {href}")

    require("/blog/" in home.links, "Homepage must expose blog")
    for meta, path in [(None, Path("blog/index.html"))] + published:
        page_html = (PREVIEW / path).read_text()
        page = Document()
        page.feed(page_html)
        require(not page.runtime and ".wasm" not in page_html, "Blog must remain static")
        require(all(fragment in page.ids for fragment in page.fragments), "Broken blog anchor")
        canonical = "https://www.somsouk.fr/" + path.parent.as_posix() + "/"
        require(f'href="{canonical}"' in page_html, "Wrong blog canonical")
        if meta:
            require(page.metadata.get("og:type") == "article", "Wrong article social type")
            blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', page_html, re.S)
            require(len(blocks) == 1, "Missing article structured data")
            structured_article = json.loads(blocks[0])
            require(structured_article["@type"] == "BlogPosting" and structured_article["datePublished"] == meta["date"].isoformat(), "Wrong article schema")
            require(structured_article["headline"] == meta["title"], "Wrong article headline")
        for href in page.links:
            address = urlsplit(href)
            if address.scheme or address.netloc or not address.path:
                continue
            resolved = urlsplit(urljoin("/" + path.as_posix(), href)).path
            target = resolved.lstrip("/") + ("index.html" if resolved.endswith("/") else "")
            require(Path(target) in actual, f"Broken blog link: {href}")

    error_html = (PREVIEW / "404.html").read_text()
    error = Document()
    error.feed(error_html)
    require("404 — Page not found" in error_html and "Doctolib" not in error_html, "404 must be an error page, not the resume")
    require(error.metadata.get("robots") == "noindex, follow", "404 must not be indexed")
    require(not error.runtime and all(fragment in error.ids for fragment in error.fragments), "Invalid 404 runtime or anchors")
    require('rel="canonical"' not in error_html and "application/ld+json" not in error_html, "Unexpected 404 SEO metadata")
    require(not any(key.startswith(("og:", "twitter:")) for key in error.metadata), "Unexpected error social metadata")
    require("/" in error.links and "/cabane/" in error.links, "Missing recovery links")
    require(all(resource.startswith("/") for resource in error.resources), "404 assets must work at nested missing URLs")
    require(proof.metadata.get("robots") == "noindex, nofollow", "Proof must not be indexed")

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
        fetch(base + "/sitemap.xml", "application/xml")
        fetch(base + "/robots.txt", "text/plain")
        fetch(base + "/cabane/memory/game.wasm", "application/wasm")
        for url in font_urls:
            fetch(base + url, "font/woff2")
        for missing in ["/__missing_migration_page__", "/missing/deep/path/"]:
            try:
                urlopen(base + missing, timeout=10)
            except HTTPError as response:
                with response:
                    require(response.code == 404, "Wrong missing-route status")
                    require(response.headers.get_content_type() == "text/html", "Wrong 404 MIME")
                    require(response.read() == (PREVIEW / "404.html").read_bytes(), "Wrong 404 body")
            else:
                raise ValueError("Missing route did not return 404")
            for resource in error.resources:
                fetch(urljoin(base + missing, resource))
    finally:
        server.shutdown()
        server.server_close()
        worker.join()
    print(f"Verified {len(legacy)} unchanged Cabane files, {page_count} page URLs, local resources and static pages; two missing-route 404 responses.")


if __name__ == "__main__":
    verify()
