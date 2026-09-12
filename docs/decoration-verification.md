# Sleeve decoration verification

Author: Codex app agent — 2026-09-12.

Baseline: local main `5a557df`. Evidence directory:
`/tmp/amazering-decoration-evidence/` (temporary, not published).
No files under the existing untracked `exports/` directory were modified.

## Geometry and export evidence

- `check.mjs`, `geometry.json`: 32 passing cases. All band counts × both styles ×
  engraved/zero/raised relief, all nine marker silhouettes plus None, default,
  combined waves, maximum 32 radial/32 rim waves, shortest and tallest sizes.
- Closed/oriented solid conversion, finite nondegenerate triangles, positive
  volume, and Boolean union of sleeve plus raised decorations forming one
  connected solid. Raised pieces retain actual embedded intersections.
- Central radial ray samples measured at least **0.594 mm** of sleeve wall in
  the final matrix. This is sampled evidence; the shared-reference cuts and
  protective radial floor also bound overlapping engravings by construction.
- `focused.mjs`, `focused.json`: raised and engraved **O counters** stay open;
  strokes exist; engraving depth is within 0.01 mm of the requested −0.20 mm;
  text is centered at π from the tooth with Marker None. Ten invalid input
  cases are rejected. Hidden invalid text drafts are retained without blocking
  a center-band model. The shortest sleeve with combined rim/band waves and
  three negative depths builds successfully at adjusted fit-bound inputs.
- Disabled-decoration sleeve and all mechanical meshes compare exactly with
  the prior implementation. Mechanical dimensions and placement remain fixed.
- `exports.py`, `exports.json`: all 32 geometry exports match their preview
  oriented triangle soups; actual browser STL and multipart 3MF downloads also
  match. ZIP CRC/XML, bed alignment and nonempty named resources are checked.
  Raised pieces are optional named parts; engraving is in Outer ring.

## Browser and visual evidence

`browser.mjs` uses a fresh headless Playwright browser and isolated profile,
with no visible windows or connection to Carlos's logged-in browser. Its test
route exposes the existing engine only to inspect state. `browser.json` records
maze/view retention, dimension draft retention, text gating/recovery, None,
invalid-export blocking, automatic fade synchronization, manual transparency
override, no page errors and no mobile horizontal overflow.

`recovery.mjs` / `recovery.json` also force a kernel failure in the isolated
test session: the old preview remains, both exports block, a forced stale STL
click produces no download, and corrected geometry restores both exports.

- `decorated-desktop.png`, `engraved-desktop.png`, `mobile.png`: actual app.
- `guide-desktop.png`, `guide-mobile.png`: expanded guide visual inspection.
- `guide-source-marker.png`, `guide-source-text.png`: original app-rendered
  screenshot pixels embedded in the committed annotated SVGs. They show the
  same fully decorated model from opposite sides, with zero preview transparency.
  Annotations identify controls; no geometry was illustrated or fabricated.

The harnesses use Three r124, the vendored Manifold 3.1.1 kernel and the local
app at `http://127.0.0.1:5503/`. Full temporary case exports and triangle data
remain in the evidence directory. The guide assets embed their pixels so the
app does not depend on any temporary file.

These are geometry and export checks, **not physical-print qualification**.
Existing multibody overlaps (including raised decorations) require slicer
filament ownership review; fine lettering strokes and wavy-rim bed contact
still require toolpath/print review. No deployment or publication was performed.
