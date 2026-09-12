# Current 0–5-band verification and aesthetic approval

Author: Codex app agent — 2026-09-12.

Current evidence: `/tmp/amazering-approval-evidence/`. Durable local approval
files and compact verification copies: `exports/2026-09-12-aesthetic-review/`.
Existing exports and both guide SVGs were preserved. The new artifact directory
is intentionally outside the scoped source commit, alongside the existing
untracked historical exports. No publication or deployment occurred.

- Ten actual geometry cases passed: counts 0–5, custom paired spacing/distance,
  longer engraved text, overlapping bands with a nonblocking advisory, and the
  full default. Centerline errors were below 0.000002 mm. Counts 1, 3 and 5
  produced two raised text lines at the requested above/below offsets.
- Sleeve plus attached decorations formed one connected Boolean solid in each
  case, with finite, nondegenerate triangles and closed, oriented topology.
  The full default sleeve/decorations union volume was 1616.8211 mm³; smallest
  default decoration triangle area was 6.59 × 10⁻⁹ mm². A separate dense central
  ray check measured a minimum 0.60009 mm remaining wall. Sampling does not
  replace the existing protective floor or qualify all possible inputs.
- Mechanical meshes matched across the matrix. The initial default check also
  compared inner tube and working tooth to the previous implementation exactly.
- Ten exported 3MFs matched preview triangle soups exactly. Actual browser
  STL/3MF downloads also matched exactly: **40,372 triangles**, six named
  nonempty resources, valid ZIP CRC/XML and bed-up placement. The saved maze
  in the matrix differs from the randomly generated approval-screen maze;
  the latter’s STL, 3MF and all four screenshots correspond to one another.
- Browser checks passed all counts, paired-control visibility, two independent
  text-draft retention, unchanged font size with longer text, edited maze/view
  retention, invalid-input blocking/recovery, automatic 0–30% fade and manual
  override. No page errors. Desktop 1440×1100 and mobile 390×844 full-page
  screenshots were visually inspected; mobile has no horizontal overflow.
  DOM and visual order: rendering, Appearance, Visual guide, design inputs.
- `a - maze - ring around the ring` renders at unchanged 2.5 mm font size,
  beyond the former short arc bound. At 4 mm this particular engraving creates
  a collapsed triangle: it correctly displays a specific actual geometry error
  and blocks export. Nominal circumference/placement warnings alone do not block.
- Injecting failure in `Manifold.union` kept the last preview and blocked both
  stale export handlers, including forced DOM clicks. Restoring the kernel and
  correcting the input restored both downloads. The initial prototype-subtract
  injection did not exercise the current wrapper; that failed harness attempt
  is not counted as a product pass.
- Bambu Studio **02.03.01.51** imported the matrix default as manifold and
  completed diagnostic slices of both matrix and exact approval 3MFs. Approval
  result: success code 0, one object, 40,372 triangles, no reported slice warning.
  CLI inputs selected P1S 0.4 nozzle, 0.20 mm Standard and Generic PLA, single
  filament. Thumbnail/roundtrip attempts hit OpenGL initialization errors;
  slicing succeeded with thumbnail generation skipped. No physical printer was
  contacted. No toolpath-by-toolpath, multicolor, support-removal or fine-type
  qualification is claimed; CLI mass fields were zero and are not useful estimates.

Approval images: `approval-desktop.png`, `approval-mobile.png`,
`approval-heart.png`, `approval-text.png` in the new export folder. They use
opaque preview for surface review. Shallow engraving is low-contrast with the
existing dark material. The guide SVG screenshot assets remain byte-identical
and are labeled an earlier example until Carlos approves the default aesthetic.

Print limitations: 1.4 mm pair spacing leaves 0.4 mm between 1 mm wide lines;
all requested six-cycle/1 mm wave and raised-marker/band defaults are enabled.
Nominal rim/text layout warnings remain visible. The 0.8 mm sleeve is not
thickened to compensate for −0.2 mm engraving (approximately 0.6 mm remains).
Wavy bottom rims lack continuous flat bed contact; adhesion, overhangs, supports,
removal near moving gaps, fine lowercase strokes and counters need print review.
**Not print-qualified; aesthetic approval is still pending.**

---

# Earlier 0–2-band verification (historical)

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
