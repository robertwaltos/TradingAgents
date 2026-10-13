#!/usr/bin/env node
// guard-no-pill-wordmark.mjs: the retired uppercase pill wordmark (KOYDO, a dot, APP, inside a rounded pill), in any colour, may never come back.
//
// CANONICAL SOURCE: koydo-design/scripts/guard-no-pill-wordmark.mjs. Repos carry a byte-identical copy at
// scripts/koydo-pill-guard.mjs, run in prebuild and pre-push. Edit here, then re-copy; never fork a copy.
//
// Why (2026-10-12): the pill came back on app.koydo.app after a 325-repo sweep, because every earlier sweep and
// guard matched it by FILENAME and the same pill also lived under other names. This guard matches by CONTENT:
//   1. a file whose SHA-256 is a known pill (SVGs are also hashed with CRLF normalised to LF), anywhere in the
//      repo's tracked or untracked (non-ignored) files. The file must not exist at all, referenced or not;
//   2. an SVG that draws the pill: an uppercase KOYDO <text> element next to an APP <text> or a pill rect;
//   3. text naming a retired pill file, or the pill's lockup text (KOYDO, middle dot, APP; any encoding of the dot).
// Rasters are hashed only when their byte size equals a known pill's (an exact hash needs an exact size), plus
// every raster on a logo-like path, so the scan takes well under a second on most repos.
//
// The canonical mark is the lowercase Fredoka "koydo": koydo-design/logos/wordmark/
//   koydo-wordmark-lowercase-fredoka-semibold-orange-1500x640.canon.a2b52329e211.png (or the inline SVG).
// There is no override flag. Bringing the pill back takes a written owner decision and an edit to this file.
//
//   node scripts/koydo-pill-guard.mjs [repoRoot]     exit 0 = clean, 1 = pill found
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, readSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

// sha256 -> byte size (0 = size unknown). Every entry was opened and confirmed to be the pill.
// Hashes are written as two halves so this file never contains a full pill hash string (some repos ban that
// exact string in their own brand checks, and this guard must be able to live next to them).
export const PILL_SHA256 = new Map([
  ["154b0b9b3ebf050edcd33bd0eb8c8d44" + "0d43d14eba29f3cd413bb417a78aa96f", 19806], // gold pill PNG
  ["562f1e53d48131f1cafe995e4c662540" + "cc54e777f5ce7f2c6d690a20834722cf", 214918], // gold gradient pill PNG
  ["748accc854c995294d5f5cce9f5452df" + "18735c813c935513a6160f2c9aac5629", 59732], // orange pill PNG
  ["8c280bc1435f6c4ef7f2e25adc2e6d43" + "6b6643e5df0537ebf6a6a6efd390bbf0", 44736], // orange pill PNG
  ["edc5c7d7825c4a9b0d9755b096bd4320" + "b37988dd2ead14444dff03a8a5fd9da9", 21892], // orange pill PNG, rounded type
  ["11010820d324e4ca6b28185824080d57" + "cdcd74e8837c2bef593871b8cf339f33", 2492],  // gold pill SVG
  ["66119a747fb9a16ecc782fc04d455765" + "5653c646f004f35ab6917e77f91b6243", 2152],  // gold pill SVG, light
  ["7a1a268b88f3eb2bb88768a65e36d1eb" + "ce66ff2851cc028e9112600e529fc132", 3636],  // pill SVG with "official" header
  ["dec13527c6b3e0a71aace3f12985142f" + "d25731ca76d4639c2c7f1ce3a784454e", 3096],  // amber pill SVG
  ["727fbc9cd0f1fdcd341fa988e3d60044" + "6921752220a0a4673d4d349b075176f1", 3561],  // gold pill SVG
  ["b731ce7628eb004ee86b755440b1a160" + "7381315c86a97b137994e4afbedab597", 2439],  // gold pill SVG
  ["f54f9901951127e309183a83665c69f0" + "e5c57c1c3efdd82a7a4cb184f0714daa", 34269], // orange pill PNG, losslessly recompressed
]);
const SIZES = new Set([...PILL_SHA256.values()].filter(Boolean));
// Pixel identity (sha256 of the decoded RGBA8 rows), keyed by WxH. A losslessly recompressed pill has new file bytes
// but the same pixels, so any PNG with a pill's exact dimensions is decoded and its pixels hashed.
export const PILL_PIXELS = new Map([
  ["500x130", new Set(["3c77daa415888bae01c21b60b0c6df6f" + "6d26d7d7ecbd2d6716c2008f4e4b636f"])],   // gold pill
  ["1500x390", new Set(["59b75d0384a4e2f738d62103fa7c0c64" + "624f2cfa1e30dd9c9021aaaac6d9bee3",     // gold gradient pill
    "c94085062e9d61df99988ab0386b5324" + "e7b0ecd9df4f77fd2dbebb27e9bc4e50",                         // orange pill
    "ff493d1996afb50217a12b2670e6a1e6" + "a53de7df22afc17e6982a3d4823d5028"])],                      // orange pill (8c280bc1435f)
  ["1142x409", new Set(["06726a1e3e446afc7343a656b8af2f18" + "6802fdcd3909e38fbe9ffd2a20208650"])],  // orange pill, rounded type
]);

const pngDims = (buf) => (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47 ? `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}` : null);
// Minimal PNG decoder (8-bit grey/RGB/palette/grey-alpha/RGBA, non-interlaced) -> RGBA8. null when unsupported.
export function pngRgba(buf) {
  let pos = 8, w, h, depth, ctype, interlace, plte, trns;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("latin1", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; interlace = data[12]; }
    else if (type === "PLTE") plte = data;
    else if (type === "tRNS") trns = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  if (depth !== 8 || interlace || !ch || (ctype === 3 && !plte)) return null;
  let raw;
  try { raw = inflateSync(Buffer.concat(idat)); } catch { return null; }
  const stride = w * ch, out = Buffer.alloc(w * h * 4);
  if (raw.length < h * (stride + 1)) return null;
  let prev = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++], line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? line[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (ctype === 6) line.copy(out, o, x * 4, x * 4 + 4);
      else if (ctype === 2) { out[o] = line[x * 3]; out[o + 1] = line[x * 3 + 1]; out[o + 2] = line[x * 3 + 2]; out[o + 3] = 255; }
      else if (ctype === 3) { const i = line[x]; out[o] = plte[i * 3]; out[o + 1] = plte[i * 3 + 1]; out[o + 2] = plte[i * 3 + 2]; out[o + 3] = trns && i < trns.length ? trns[i] : 255; }
      else if (ctype === 0) { out[o] = out[o + 1] = out[o + 2] = line[x]; out[o + 3] = 255; }
      else { out[o] = out[o + 1] = out[o + 2] = line[x * 2]; out[o + 3] = line[x * 2 + 1]; }
    }
    prev = line;
  }
  return out;
}
// The pill's identity for a PNG buffer: its file hash, or (for a pill-sized PNG) its pixel hash. null when not a pill.
export function pillPng(buf) {
  const h = sha256(buf);
  if (PILL_SHA256.has(h)) return h;
  const dims = pngDims(buf);
  if (!dims || !PILL_PIXELS.has(dims)) return null;
  const px = pngRgba(buf);
  return px && PILL_PIXELS.get(dims).has(sha256(px)) ? h : null;
}
const RASTER = /\.(png|webp|jpe?g|gif|avif|ico)$/i;
const LOGOISH = /logo|wordmark|brand|lockup|pill|badge/i;
const TEXT = /\.(tsx?|jsx?|mjs|cjs|dart|json|webmanifest|ya?ml|md|mdx|txt|html?|xml|svg|css|scss|sass|less|vue|svelte|astro|swift|kt|kts|java|plist|arb|py|sh)$/i;
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".turbo", ".vercel", ".dart_tool", "build", "dist", "out", ".gradle", "Pods"]);
// Retired file names, assembled from pieces so that this file is not itself a reference to them.
const RETIRED_NAMES = [["koydo", "app", "wordmark"], ["koydo", "wordmark", "primary.canon"], ["koydo", "orange", "wordmark", "primary"]]
  .map((p) => p.join("-"));
const LOCKUP_TEXT = /KOYDO\s*(?:·|•|&middot;|&#183;|&#xB7;|\\u00[bB]7|\\xb7)\s*APP\b/;
// Text that calls a coloured pill the canonical/official mark. Agents follow such labels, so they count as findings
// unless the same line says the pill is retired.
const CANON_CLAIM = /\b(?:canonical|official|sole)\b[^.\n]{0,30}\b(?:orange|amber|gold)[- ]pill\b|\bis the (?:orange|amber|gold)[- ]pill\b/i;
const CLAIM_NEGATED = /retired|deprecat|never|\bnot\b|deleted|forbid|banned|no longer|instead|replaced|superseded|since-retired/i;
const SVG_KOYDO = /<text\b[^>]*>\s*KOYDO\s*</;
const SVG_APP = /<text\b[^>]*>\s*(?:·\s*)?APP\s*</;
// A pill is a rect at least twice as wide as tall whose corner radius is about half its height, with the uppercase
// KOYDO text drawn inside it. (A rounded-square app icon with KOYDO under it, or merch art with KOYDO beside a
// rounded stand, is not the pill.)
function svgHasPillRect(text) {
  const num = (tag, k) => Number((tag.match(new RegExp(`(?:^|\\s)${k}="(-?[\\d.]+)`)) || [])[1]);
  const words = [...text.matchAll(/<text\b([^>]*)>\s*KOYDO\s*</g)].map((m) => ({ x: num(m[1], "x"), y: num(m[1], "y") }));
  for (const [tag] of text.matchAll(/<rect\b[^>]*>/g)) {
    const x = num(tag, "x") || 0, y = num(tag, "y") || 0, w = num(tag, "width"), h = num(tag, "height"), r = num(tag, "rx") || num(tag, "ry");
    if (!(w && h && r && w >= 2 * h && r >= 0.4 * h)) continue;
    // Text without numeric x/y (positioned by a transform) is assumed inside: fail closed.
    if (words.some((t) => Number.isNaN(t.x) || Number.isNaN(t.y) || (t.x >= x && t.x <= x + w && t.y >= y && t.y <= y + h))) return true;
  }
  return false;
}
const svgDrawsPill = (text) => SVG_KOYDO.test(text) && (SVG_APP.test(text) || svgHasPillRect(text));

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] })
  .toString("utf8").split("\0").filter(Boolean).map((p) => join(root, p));

// Text files that can possibly hold a finding: they name a retired file, contain uppercase KOYDO, or embed an image.
// null = not a git work tree, so every text file gets read instead.
function textCandidates(root) {
  const grep = (args) => {
    try { return git(root, ["grep", "-z", "-l", "-I", "--untracked", ...args]); }
    catch (e) { if (e.status === 1) return []; throw e; }
  };
  try {
    return new Set([...grep(["-i", "-F", "-e", "pill", ...RETIRED_NAMES.flatMap((n) => ["-e", n])]), ...grep(["-F", "-e", "KOYDO", "-e", "data:image/"])]);
  } catch {
    return null;
  }
}

function listFiles(root) {
  try {
    return git(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  } catch {
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name)); }
        else if (e.isFile()) files.push(join(dir, e.name));
      }
    };
    walk(root);
    return files;
  }
}

// An image embedded in code as a data URL (base64 or URL-encoded SVG) is checked like a file.
const DATA_URL = /data:image\/(png|webp|jpe?g|gif|svg\+xml)(;base64)?,([A-Za-z0-9+/=%._~!$&'()*,;:@-]{40,})/g;
function embeddedPill(text) {
  for (const m of text.matchAll(DATA_URL)) {
    let buf;
    try { buf = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8"); } catch { continue; }
    const h = sha256(buf);
    if (PILL_SHA256.has(h)) return h;
    if (m[1] === "png" && pillPng(buf)) return h;
    if (m[1] === "svg+xml") {
      const svg = buf.toString("utf8");
      if (PILL_SHA256.has(sha256(Buffer.from(svg.replace(/\r\n/g, "\n"), "utf8"))) || svgDrawsPill(svg)) return h;
    }
  }
  return null;
}

// Findings are { file, line, kind, message }. kind: "file" (a pill file: delete it), "svg-shape" (an SVG that draws
// the pill: delete it), "embedded" (a data URL holding a pill), "name" (text names a retired file), "lockup" (text).
export function scanRepo(root) {
  const self = fileURLToPath(import.meta.url);
  const findings = [];
  const add = (file, line, kind, message) => findings.push({ file, line, kind, message: `${file}${line ? `:${line}` : ""}: ${message}` });
  const candidates = textCandidates(root);
  for (const file of listFiles(root)) {
    const rel = relative(root, file).split(sep).join("/");
    const name = basename(file);
    if (/guard-no-pill-wordmark\.mjs$|koydo-pill-guard\.mjs$/.test(name) || file === self) continue;
    let size;
    try { size = statSync(file).size; } catch { continue; }
    const isSvg = /\.svg$/i.test(name);
    if (RASTER.test(name)) {
      const isPng = /\.png$/i.test(name);
      let head = null;
      if (isPng && size <= 8_000_000) {
        const fd = openSync(file, "r"); head = Buffer.alloc(24);
        try { readSync(fd, head, 0, 24, 0); } finally { closeSync(fd); }
      }
      const pillSized = head && PILL_PIXELS.has(pngDims(head));
      if (!SIZES.has(size) && !pillSized && !(LOGOISH.test(rel) && size <= 4_000_000)) continue;
      const buf = readFileSync(file);
      const h = isPng ? pillPng(buf) : PILL_SHA256.has(sha256(buf)) ? sha256(buf) : null;
      if (h) add(rel, 0, "file", `retired pill image (sha256 ${h.slice(0, 12)}${PILL_SHA256.has(h) ? "" : ", same pixels as a pill"}); delete it`);
      continue;
    }
    if (!TEXT.test(name) || size > 8_000_000 || (candidates && !candidates.has(file))) continue;
    const buf = readFileSync(file);
    if (isSvg) {
      const h = sha256(buf), hLf = sha256(Buffer.from(buf.toString("latin1").replace(/\r\n/g, "\n"), "latin1"));
      if (PILL_SHA256.has(h) || PILL_SHA256.has(hLf)) { add(rel, 0, "file", `retired pill SVG (sha256 ${(PILL_SHA256.has(h) ? h : hLf).slice(0, 12)}); delete it`); continue; }
    }
    const text = buf.toString("utf8");
    if (isSvg && svgDrawsPill(text)) { add(rel, 0, "svg-shape", "SVG draws the pill lockup (uppercase KOYDO text in a pill); delete it"); continue; }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("data:image/")) {
        const h = embeddedPill(line);
        if (h) add(rel, i + 1, "embedded", `embeds a retired pill image as a data URL (sha256 ${h.slice(0, 12)})`);
      }
      const lower = line.toLowerCase();
      const hit = RETIRED_NAMES.find((n) => lower.includes(n));
      if (hit) add(rel, i + 1, "name", `names a retired pill file (${hit}…)`);
      if (LOCKUP_TEXT.test(line)) add(rel, i + 1, "lockup", "contains the pill lockup text");
      if (CANON_CLAIM.test(line) && !CLAIM_NEGATED.test(line)) add(rel, i + 1, "claim", "calls the retired pill the canonical/official mark");
    }
  }
  return findings;
}

// --self-test: builds throwaway trees and proves both directions (clean passes, every pill form fails).
function selfTest() {
  const tmp = mkdtempSync(join(tmpdir(), "pill-guard-"));
  const lockup = ["KOYDO", "APP"].join(" · ");
  const pillSvg = (fill) => `<svg viewBox="0 0 500 130"><rect x="5" y="5" width="490" height="120" rx="60" ry="60" stroke="${fill}"/>` +
    `<text x="185" y="65" fill="${fill}">KOYDO</text></svg>`;
  const cases = [
    ["clean: canonical mark + rounded-square icon with KOYDO text", { "logo.svg": `<svg><path d="M0 0"/></svg>`,
      "icon.svg": `<svg viewBox="0 0 512 512"><rect width="512" height="512" rx="96"/><text>KOYDO</text></svg>`, "a.ts": "const x = 'koydo';" }, 0],
    ["recoloured pill SVG under an innocent name", { "public/hero.svg": pillSvg("#123456") }, 1],
    ["pill lockup text in code", { "src/a.tsx": `const alt = "${lockup}";` }, 1],
    ["retired pill file named in a doc", { "README.md": `see ${RETIRED_NAMES[0]}.png` }, 1],
    ["pill SVG embedded in code as a base64 data URL",
      { "src/og.tsx": `const LOGO = "data:image/svg+xml;base64,${Buffer.from(pillSvg("#e8820e")).toString("base64")}";` }, 1],
    ["clean: merch art with KOYDO beside a rounded stand", { "public/merch.svg": `<svg><rect width="1200" height="900"/>` +
      `<text x="368" y="610">KOYDO</text><rect x="725" y="735" width="300" height="48" rx="24"/></svg>` }, 0],
    ["comment calling the orange pill canonical", { "src/types.ts": "/** Logo src; defaults to the canonical ORANGE pill wordmark. */" }, 1],
    ["clean: UI pill button and a retired-pill note", { "src/ui.tsx": "// a gold pill button for the CTA\n// the amber pill wordmark is retired; never restore it" }, 0],
    ["clean data URL (not a pill)", { "src/icon.ts": `const I = "data:image/svg+xml;base64,${Buffer.from("<svg><path d='M0 0h9v9z'/></svg>").toString("base64")}";` }, 0],
  ];
  let ok = true;
  // PNG decoder: the same pixels written with different filters and compression must decode to identical RGBA,
  // which is what lets a losslessly recompressed pill keep its pixel hash.
  const encodePng = (w, h, rgba, filterFor, level) => {
    const rows = [];
    for (let y = 0; y < h; y++) {
      const f = filterFor(y), cur = rgba.subarray(y * w * 4, (y + 1) * w * 4), prev = y ? rgba.subarray((y - 1) * w * 4, y * w * 4) : Buffer.alloc(w * 4);
      const line = Buffer.alloc(w * 4 + 1); line[0] = f;
      for (let x = 0; x < w * 4; x++) {
        const a = x >= 4 ? cur[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
        line[x + 1] = (cur[x] - pred) & 255;
      }
      rows.push(line);
    }
    const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); return Buffer.concat([len, Buffer.from(type, "latin1"), data, Buffer.alloc(4)]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(Buffer.concat(rows), { level })), chunk("IEND", Buffer.alloc(0))]);
  };
  const px = Buffer.from(Array.from({ length: 9 * 7 * 4 }, (_, i) => (i * 37 + (i >> 3) * 11) & 255));
  const pngA = encodePng(9, 7, px, (y) => y % 5, 1), pngB = encodePng(9, 7, px, () => 0, 9);
  const decoderOk = sha256(pngA) !== sha256(pngB) && pngRgba(pngA)?.equals(px) && pngRgba(pngB)?.equals(px);
  console.log(`${decoderOk ? "ok  " : "FAIL"} PNG decoder: two encodings of the same pixels decode identically`);
  ok &&= !!decoderOk;
  // Each case runs as a plain folder (reads every file) and as a git work tree (git-grep prefilter).
  for (const asGit of [false, true]) for (const [label, files, want] of cases) {
    const dir = mkdtempSync(join(tmp, "case-"));
    for (const [p, body] of Object.entries(files)) { mkdirSync(join(dir, p, ".."), { recursive: true }); writeFileSync(join(dir, p), body); }
    if (asGit) execFileSync("git", ["-C", dir, "init", "-q"], { stdio: "ignore" });
    const got = scanRepo(dir).length ? 1 : 0;
    console.log(`${got === want ? "ok  " : "FAIL"} ${asGit ? "[git] " : "[dir] "}${label} (want ${want ? "blocked" : "clean"})`);
    ok &&= got === want;
  }
  rmSync(tmp, { recursive: true, force: true });
  return ok;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes("--self-test")) process.exit(selfTest() ? 0 : 1);
  const root = process.argv[2] || process.cwd();
  const findings = scanRepo(root);
  if (findings.length) {
    console.error(`✘ pill guard: the retired pill wordmark is in this repo (${findings.length}):`);
    for (const f of findings.slice(0, 200)) console.error("  " + f.message);
    if (findings.length > 200) console.error(`  … and ${findings.length - 200} more`);
    console.error("Delete pill files and point every render site at the canonical lowercase mark:");
    console.error("  /logos/koydo-wordmark-lowercase-fredoka-semibold-orange-1500x640.canon.a2b52329e211.png");
    process.exit(1);
  }
  console.log("✓ pill guard: no retired pill wordmark (content-hash + SVG + text checks)");
}
