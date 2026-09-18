# Third-party notices

The source code of this repository is MIT licensed — see [`LICENSE`](./LICENSE).
**MIT does not relicense anything listed on this page.** Each item below keeps its own terms.

Two categories are kept separate on purpose, because the obligations differ:

1. **Assets redistributed inside this repository.** Their bytes are committed here, so their
   licenses must travel with this repository.
2. **Packages declared in `package.json`.** Their bytes are *not* committed here; they are
   fetched by the consumer at install time. They are listed so an adopter knows what they are
   taking on — one of them is not an open-source license.

Every license identifier below was read from the package's own `package.json` or from its
bundled license file. Nothing here was inferred from a package name.

---

## 1. Assets redistributed inside this repository

### JetBrains Mono — SIL Open Font License 1.1

| | |
|---|---|
| Files | `public/fonts/jetbrains-mono/*.woff2`, `src/assets/fonts/JetBrainsMono-{Regular,Bold}.ttf` |
| License | SIL Open Font License, Version 1.1 |
| Upstream | <https://github.com/JetBrains/JetBrainsMono> |
| License text | <https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt> |

> **⚠ OPEN ITEM — not resolved.** The OFL 1.1 requires its full text to be distributed with the
> font files. That text is **not** vendored in this repository yet, and it could not be retrieved
> while these notices were written (no network access in that environment). Linking is a
> stopgap, not compliance.
>
> **To close this:** copy the verbatim `OFL.txt` from the upstream release into both
> `public/fonts/jetbrains-mono/OFL.txt` and `src/assets/fonts/OFL.txt`.
>
> **Provenance is also only circumstantial.** These files are identified as JetBrains Mono by
> their filenames and by the `@font-face` declarations in `src/styles/global.css`. The upstream
> release they came from is unknown, and no checksum ties them to one. Treat the identification
> as probable, not verified.

### Draco 3D Data Compression — Apache License 2.0

| | |
|---|---|
| Files | `public/draco/draco_decoder.js`, `draco_decoder.wasm`, `draco_encoder.js`, `draco_wasm_wrapper.js` |
| License | Apache License 2.0 |
| License text | [`public/draco/LICENSE`](./public/draco/LICENSE) — verbatim canonical Apache-2.0 |
| Upstream | <https://github.com/google/draco> (© Google LLC) |

> **⚠ PARTIAL — version provenance unverified.** The filenames match the standard Draco
> decoder distribution that ships with three.js, but the committed files **do not** match the
> ones in the installed `three` package (MD5 differs for all three compared files). They are a
> different Draco build and the exact version is unknown.
>
> Apache-2.0 also requires preserving any upstream `NOTICE` file. No `NOTICE` accompanied these
> binaries, so none could be preserved. Whether upstream ships one for this build is unverified.
>
> **To close this:** re-vendor the decoders from a known Draco or three.js release and record
> the version, or drop `public/draco/` entirely — nothing in this template currently loads a
> compressed GLB.

---

## 2. Declared packages

Not redistributed by this repository. Installed from the registry by `bun install`.

### ⚠ GSAP is not open source

| | |
|---|---|
| Package | `gsap@^3.15.0` |
| License field | `Standard 'no charge' license: https://gsap.com/standard-license` |

This is a **custom commercial license, not an OSI-approved open-source license**. It is free of
charge for most uses, but it carries conditions that MIT does not, and some uses require a paid
commercial license from the vendor. An adopter of this template inherits that obligation.

Read <https://gsap.com/standard-license> before shipping a commercial product built on this
template. If the terms do not fit your use, GSAP is used only for the motion layer
(`src/layouts/BaseLayout.astro` and the home hero) and can be removed.

### Mozilla Public License 2.0

File-level copyleft: modifications to the licensed files themselves must be published under the
MPL. Using them as unmodified dependencies does not affect the license of your own code.

| Package | Version |
|---|---|
| `satori` | `^0.26.0` |
| `@resvg/resvg-js` | `^2.6.2` |

### Apache License 2.0

| Package | Version |
|---|---|
| `schema-dts` | `^2.0.0` |
| `typescript` (dev) | `^6.0.3` |
| `@lhci/cli` (dev) | `^0.15.1` |

### MIT

| Package | Version |
|---|---|
| `astro` | `^7.1.3` |
| `@astrojs/partytown` | `^2.1.7` |
| `@astrojs/react` | `^6.0.1` |
| `@astrojs/rss` | `^4.0.19` |
| `@astrojs/sitemap` | `^3.7.3` |
| `@react-three/drei` | `^10.7.7` |
| `@react-three/fiber` | `^9.6.0` |
| `@tailwindcss/vite` | `^4.2.2` |
| `tailwindcss` | `^4.2.2` |
| `three` | `^0.184.0` |
| `@types/three` | `^0.184.0` |
| `gradflow` | `^0.1.0` |
| `lenis` | `^1.3.23` |
| `react` | `^19.2.5` |
| `react-dom` | `^19.2.5` |
| `@astrojs/check` (dev) | `^0.9.9` |
| `@types/react` (dev) | `^19.2.14` |
| `@types/react-dom` (dev) | `^19.2.3` |
| `@vitest/coverage-v8` (dev) | `^4.1.5` |
| `vitest` (dev) | `^4.1.5` |

Full text of each package's license is in `node_modules/<package>/LICENSE` after
`bun install --frozen-lockfile`.

---

## 3. Scope of this review

**Covered:** direct dependencies and devDependencies declared in `package.json`, and every
third-party asset committed under `public/` and `src/assets/`.

**Not covered:** transitive dependencies. `bun.lock` resolves 911 packages; only the ~26 direct
ones were reviewed. A full transitive license audit has not been performed, and this document
must not be read as one.

**Other committed assets** — `public/assets/*.svg`, `public/masks/*.svg`, `public/favicon.svg`,
`src/assets/blog/example-post.png` — are template placeholders with no third-party license
recorded. They are assumed to be original to this repository. That assumption is **unverified**;
if any of them was imported from elsewhere, its provenance needs recording before release.

## 4. Open items summary

| Item | Status |
|---|---|
| JetBrains Mono OFL 1.1 verbatim text | **Not resolved** — linked only; must be vendored |
| JetBrains Mono upstream version | **Unverified** — identified by filename and `@font-face` only |
| Draco build version | **Unverified** — does not match the installed `three` copy |
| Draco upstream `NOTICE` file | **Unverified** — none accompanied the binaries |
| Transitive dependency licenses | **Not reviewed** |
| Placeholder SVG/PNG provenance | **Assumed original, unverified** |
| MIT copyright holder | Currently "test-astro-html-build contributors" — a human decision if a named holder is wanted |
