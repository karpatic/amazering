# A-Maze-Ring — accepted standard model

Carlos selected this design as the desired model after the physical-print
iterations and bottom-row correction. It is the app's sole active model,
not an experimental preset. The older reference preset is retired.

## Default geometry contract

- Default bore: 18 mm; US ring sizing remains adjustable.
- Inner tube: 21.2 mm axial height, 0.6 mm radial wall thickness.
- Maze grid: 20 mm axial span; the default four rows retain a 5 mm pitch.
- Bottom ramp: 1.2 mm of dedicated bed allowance outside that grid. The bottom
  boundary stays in place and higher boundaries have shifted upward, removing
  the former bottom-row pinch without changing their wall profiles.
- Maze walls: 1.0 mm outward projection. Existing tapered/softened profiles
  and junction treatments remain intact.
- Outer sleeve: 15 mm axial height, 0.8 mm radial thickness.
- Tooth: 1.0 mm exposed inward reach plus 0.2 mm sleeve overlap; curved working
  face concentric with the tube and an integral approximately 45° underside
  ramp. The former circular cylinder and separate gusset are retired.
- Tooth envelope: 3.2 mm tall, Z 5.9–9.1 mm, centered at Z 7.5 mm. The sloped
  underside means the working face is not vertically symmetric; the unrounded
  tip spans Z 7.1–9.1 mm. Exposed edges retain the small bevels/rounding.
- Tactile locator: gold in the preview, centered behind the tooth at Z 7.5 mm.
  Marker silhouettes follow the sleeve curvature within the existing 3.6 mm envelope.
  The current decorative default is a heart at +1 mm; None and engraving are available.
- Nominal running gaps: 0.18 mm sleeve-to-wall, 0.18 mm tooth-to-tube, and
  0.25 mm axial clearance allowance in placement checks.
- Reference printing setup: Bambu Lab P1S, PLA, 0.4 mm nozzle, about 0.2 mm layers.

These values are owned by `printDesign.js` and its derived dimensions. Maze
connectivity is owned by `mazeModel.js`; geometry changes must not silently
change a user's route. The default bore is not a universal finger size.

## App and export

The active registry contains only `standard`; unknown or retired preset IDs
resolve to this model. There is no design selector. Ring-size selection,
wall editing, orbit/zoom, rotation controls and bed-up STL export remain.
The existing internal legacy geometry branches are not exposed as a model;
they were left untouched to avoid changing the accepted mesh during retirement.

Use **Export bed-up STL** for the currently displayed maze and size. Both
moving parts start at Z = 0. Older files in `exports/` are retained historical
artifacts and are not regenerated automatically.

**Export 3MF** downloads one browser-local file for the current maze, bore and
height. It contains one aligned multipart object in the same bed-up placement
as STL; keep it together on import (do not split or auto-arrange parts).
In Bambu Studio's Objects list, assign your chosen filament slots:

| Named part | Suggested slot |
| --- | --- |
| Maze walls | 1 |
| Tooth | 1 (same filament as walls) |
| Outer ring | 2 |
| Inner ring | 3 |
| Tooth marker (when raised) | 1, or any chosen filament |
| Decorative bands (when raised) | 1, or any chosen filament |
| Sleeve lettering (when raised) | 1, or any chosen filament |

Slots are a suggested manual mapping, not encoded printer/AMS assignments.
No printer profile, painted triangles or preselected colors are included.
The file has four mechanical Core 3MF mesh resources, up to three optional
raised-decoration resources, and one components/build item,
with minimal `Metadata/model_settings.config` part-name metadata for Bambu.
The [3MF Core specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md)
defines the assembly; Bambu's [3MF importer/exporter source](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp)
reads part IDs and `name` metadata (core mesh names alone can be replaced by
assembly-name fallbacks).

Mechanical wall/tube and tooth geometry remain unchanged. The sleeve contains
real Boolean engravings; raised decorations embed into it by 0.15 mm. Existing
wall/tube and tooth/sleeve overlaps remain; the whole export is not a Boolean union.
Review material ownership at overlapping parts, repaired shells, first layers
and moving gaps in the slicer before printing. Historical pre-decoration ad-hoc Three r124 checks on the
saved maze, all nine marker shapes and short/tall/small/large cases passed ZIP
CRC/XML, five-part structure, finite nondegenerate triangles, bed alignment and
exact oriented triangle-soup equality to the corresponding STL. Before the
later marker enlargement, the default STL was byte-identical.
The enlargement changes only the marker geometry, not the working mechanism;
27 final ad-hoc cases verified unchanged non-marker STL geometry and mounted
marker clearance. Exports do not mutate inputs or follow preview rotation.
Bambu Studio 02.03.01.51 CLI import/roundtrip retained one object with all five
part names. The live browser selector and actual 3MF download were exercised.
These checks do **not** qualify sliced toolpaths or physical multicolor printing.
Temporary local verification output was not retained.

Ring size and physical height are controls in the 3D panel; maze rows/columns
are drafts in the SVG panel and apply only on Generate, replacing the maze.
Opening the bottom, initially collapsed size/print details does not generate
anything. Size/height-only changes preserve the current maze topology.

Rows are bounded to 2–6 and columns to 6–12 whole numbers. Height is at least
`rows × 5 + 1.2` mm and at most 31.2 mm. Generate raises height when more rows
need space, but does not automatically shorten it for fewer rows. A shorter
height draft can also be applied together with a compatible new row count.
Sleeve height is `0.75 × (height − 1.2)` mm, with the tooth and tactile marker at
its midpoint. The default remains exactly 21.2 / 15 / 7.5 mm. Radial walls,
tooth profile and running gaps are unchanged. Column limits retain positive
shared-envelope tangential room at the chart's smallest bore; wall-dependent
resting-placement warnings remain authoritative, not a printability guarantee.

## Radial exterior waves

Author: Codex app agent — September 12, 2026.

The 3D settings include 0–32 whole exterior waves and an outward wave height
of 0–3 mm. The current defaults are six waves and 1 mm; either zero disables this effect.
Height is radial trough-to-crest depth, not axial height. A cosine profile adds
material outside the sleeve, with a trough behind the tooth. The axial band
height, inner mating facets/chamfers, maze, working tooth and locator stay fixed.
Wave resolution is at least 32 angular segments per cycle; subdivided inner
facets retain the accepted mating surface. Preview, STL and multipart 3MF use
the same sleeve mesh. Changes preserve maze edits, orbit, zoom and rotation state.
Large or frequent waves can surround more of the fixed tactile marker; check
its visibility and material overlaps in the slicer.

Focused checks covered count/height pairs 0/0, 0/3, 8/0, 1/0.1, 3/0.5,
8/1, 17/2 and 32/3 at the default bore/axial height. Zero-wave STL was
byte-identical to commit `83af115` for the same maze. Active sleeves passed
closed/oriented edge checks, positive volume, finite nondegenerate triangles,
measured wave count/depth and unchanged axial height. Inner-facet radial error
was below 0.000001 mm (Float32 rounding); all non-sleeve meshes were unchanged.
All eight exports matched preview triangles and STL/3MF oriented triangle soups
exactly, with five named parts, valid ZIP CRC/XML and bed alignment. Browser
checks passed edited-maze/view preservation, invalid-input blocking/recovery,
STL/3MF downloads and desktop/mobile visual review. Evidence and runnable ad-hoc
harnesses: `/tmp/amazering-wave-evidence/` (temporary local files).
These checks do not qualify sliced toolpaths, physical fit or physical printing.

## Axial rim/edge waves

Author: Codex app agent — September 12, 2026.

Independent rim/edge controls provide 0–32 whole waves and 0–1 mm axial height.
The current defaults are six waves and 1 mm; either zero disables only rim waves. Radial count/height
remain independent, with their outward shape and 0–3 mm range.
The translucent outer-band preview from `96d1ad7` is retained.

For rim count N and height h, the inward inset at angle θ is
`d = h × (1 − cos(N × (θ − π/2))) / 2`. Each lower rim point rises from its
original bed level by d; its matching upper point falls by d. Thus h is the
actual trough-to-crest axial travel of **each** rim, not ±h amplitude, radial
bulge depth or the total band-width change. The two rims mirror one another
about the band midplane, with N smooth scallops on each rim. Their separation
ranges from the original sleeve width W to W − 2h. Chamfers follow the rims.
Full width is retained behind the tooth, and the maximum axial envelope stays
unchanged. At the shortest 7.5 mm sleeve and maximum h = 1 mm, at least 5.5 mm
of band remains axially (5.1 mm excluding both 0.2 mm chamfers).

The scallops trim the axial ends; they do not displace the retained inner radial
mating facets or narrow the running clearance. With radial waves disabled,
subdivision also retains the original outer radial facets. Tooth, marker and
maze geometry/placement remain unchanged; the full tooth and all nine marker
attachment envelopes fit inside the retained central band at the shortest size.
Rim tessellation includes exact extrema and at least 32 segments per cycle;
additional sampling for radial waves changes neither control's profile.
Preview, STL and 3MF all consume this same band geometry.

**A wavy lower rim has no continuous flat bed footprint.** Only the lowest
scallop locations reach Z = 0. Bed-up export does not flatten the rim or add
supports. Review first-layer adhesion, bridging/overhangs and possible supports
in the slicer, including support removal near moving clearances. These wave
variants are **not print-qualified**; mesh/export checks do not establish
support-free printing, physical fit or successful toolpaths.

Focused verification covered 13 cases: none, inactive count/height combinations,
radial only, rim only, both, maximum 32/3 mm radial plus 32/1 mm rim, the shortest
11.2 mm ring at 14.1 mm bore, and the tallest 31.2 mm ring at 22.6 mm bore.
Disabled-rim STL remained byte-identical to `96d1ad7` for the same inputs;
non-sleeve meshes were identical in every case. Active sleeves passed closed,
oriented edge checks, positive volume, finite nondegenerate triangles, actual
rim-count/height measurements and mirrored-profile checks. Inner radial facet
error stayed below 0.000001 mm. All nine marker and tooth envelopes cleared the
retained central band. All 13 STL/3MF pairs matched preview/export triangles
exactly; actual browser downloads also matched each other. ZIP CRC/XML,
five-part structure and bed alignment passed.

Headless browser checks verified independent controls, invalid-input blocking
and recovery, edited-maze and draft-dimension retention, marker selection,
orbit/zoom and paused-rotation retention, and desktop/mobile screenshots.
Evidence and runnable ad-hoc harnesses: `/tmp/amazering-rim-evidence/` (temporary
local files). The isolated-band diagnostic screenshots use the actual preview
mesh and unchanged translucent material, with other parts hidden only in the
test session so both rims can be inspected.

## Sleeve decorations and compact controls — aesthetic awaiting approval

Author: Codex app agent — September 12, 2026.

Only decoration defaults changed. Bore 18 mm, tube 21.2/0.6 mm, sleeve
15/0.8 mm, tooth, maze profiles and running gaps remain unchanged. The mechanical
standard remains accepted; the new default aesthetic is for Carlos’s approval.
The original guide SVG screenshot assets are preserved byte-for-byte, labeled
as an earlier two-band example. **Do not remake guide images before Carlos
approves the default aesthetic.** Approval screenshots are separate evidence.

| Input | Current default | Range / meaning |
| --- | --- | --- |
| Marker | Heart, +1 mm | None or existing silhouettes; depth −0.2…+1 mm |
| Decorative bands | 4, wavy | 0–5 bands |
| Line width / relief | 0.6 mm / +0.15 mm, tapered raised sides | Width 0.4…3 mm up/down; depth −0.2…+1 mm outward |
| Line waves / waviness | 6 / 1 mm | 1–16 cycles; 0…3 mm above and below centerline |
| Distance from center | H/4 = 3.75 mm | Blank follows sleeve height; explicit 0…20 mm to each line or pair midpoint |
| Pair spacing | 1.4 mm | 0.1…20 mm, line center to line center |
| Side bulges | 6, 1 mm outward | 0–32; 0…3 mm added to sleeve sides |
| Rim waves | 6, 1 mm inward top dip; flat bottom enabled | 0–32; 0…1 mm; disable Flat bottom to wave both rims |
| Sleeve text | `A - MAZE - RING` | Exact uppercase default; custom casing retained, centered opposite tooth; up to 96 supported characters per line |
| Second text draft | Blank | Shown below center band for counts 1, 3, 5; retained when hidden |
| Font size / depth | 2.5 mm / −0.2 mm | Font 0.5…10 mm; depth −0.2…+1 mm |

Here H is sleeve height, 15 mm by default. Positions measured upward from the
sleeve bottom are: count 0 none; count 1 H/2; count 2 H/4 and 3H/4;
count 3 H/6, H/2 and 5H/6; count 4 two pairs centered at H/4 and 3H/4;
count 5 those four plus H/2. Distance edits move the two singles or pair
midpoints symmetrically from H/2. Pair spacing moves each pair’s lines equally
about its midpoint. At default height the four centerlines are at 3.05, 4.45,
10.55 and 11.95 mm above the bottom. Their common wave phase preserves a
0.4 mm up/down gap within each pair despite 1 mm line waviness.

Counts 1, 3 and 5 expose independent upper and lower text drafts. For one
band, text centers are at H/4 and 3H/4; with neighboring bands, each text line
is halfway between the center band and its nearest neighbor. Counts 0, 2 and
4 center the first draft and retain the second invisibly. Blank omits a line.
No draft or requested font size is silently changed. Small or crowded layouts
can overlap; this is a specific advisory rather than a nominal fit blocker.

The prior generic invalid-dimensions error was caused by text length reducing
the dynamic maximum font size below an unchanged draft value. Static finite
input limits now replace those dynamic blockers. Nominal rim margins, band
spacing, text/band proximity, fine type, and text approaching a full turn are
nonblocking warnings. The old 144° text arc restriction is removed. Text may
use the full circumference and beyond if the actual solid kernel accepts it;
wrapping back onto itself or approaching the marker is explicitly warned.
Finite values, supported text, bounded input work, maze topology, mechanical
clearances, closed/oriented triangles, actual Boolean success and embedded
attachment remain blockers. Failed rebuilds retain the old preview with the
specific error and guard both export handlers against stale downloads.

Print-minded choices and limits: pair spacing is 1.4 mm instead of 1 mm so
1 mm wide lines remain distinct. All requested wave counts are six and all
requested wave sizes/marker/band relief reach 1 mm at the default height.
The original conservative rim margin and text proximity checks can still
warn at this aesthetic; dimensions are retained for review. The nominal
sleeve stays 0.8 mm thick; −0.2 mm engraving leaves about 0.6 mm locally,
**not** an untouched 0.8 mm residual wall. No bore, tooth or gap compensation
was added. A protective cylinder retains the existing 0.55 mm nominal floor
for overlapping cutters; cuts reference one original surface and do not add.

A wavy lower rim lacks a continuous flat bed footprint. Review adhesion,
overhangs, bridging, supports and removal near moving gaps. Fine engraved
strokes and counters at 2.5 mm font size may disappear or fill in with the
0.4 mm nozzle. Raised features remain embedded, overlapping multipart volumes;
STL is not a single Boolean union and filament ownership needs slicer review.
This aesthetic is **not print-qualified**.

The panel order is rendering → Appearance → existing Visual guide → design
inputs. Physical labels describe up/down line travel, inward rim dip and
outward sleeve thickness. Native controls stay compact and responsive.
Maze edits, size drafts, orbit/zoom, paused rotation, synchronized automatic
0–30% transparency and manual override remain. STL and multipart 3MF share
actual geometry. Verification and approval artifact paths are recorded in
[decoration verification](docs/decoration-verification.md).

## Acceptance and verification boundaries

Carlos's acceptance establishes this as the project's standard design.
It does not certify all sizes, materials, printers or slicer settings. Keep
real invalid-geometry and blocked-placement warnings; check slicing and fit
when those inputs change. Intersecting tooth/sleeve/locator shells are not
claimed to be a Boolean-unioned solid or universally support-free.

The bottom-row correction passed ad-hoc Three r124 / STLExporter r117.1
checks at 14.1, 18 and 22.6 mm bores. Sampled bottom/interior passage sections
matched at about 4.57 mm, axial endpoint checks passed, and generated STLs
had 12,792 nondegenerate triangles. Browser review confirmed the corrected
dimensions and preserved maze. Those were geometric checks, not a formal suite
or exhaustive all-motion qualification.

Promotion changes model naming, selection and documentation only. Its mesh
identity was checked against the immediately preceding accepted source:
ad-hoc exports were byte-identical at 14.1, 18 and 22.6 mm bores. Browser
review confirmed the standard label, removed preset picker and preserved
current maze/view. Promotion evidence: `/tmp/hermes-verify-standard-model-m154aorw/`.

## Historical development

Superseded trial dimensions, previous warnings and iteration logs are kept in
[the design history](docs/print-design-history.md), not presented as current
model specifications. No old exports or rollback history were deleted.

### September 12 continuation: subtle bands and bed contact

Author: Codex app agent — 2026-09-12

Current defaults supersede the earlier aesthetic measurements above: four
0.6 mm bands at +0.15 mm with tapered sides, exact `A - MAZE - RING`, and a
flat lower sleeve rim. Lower waves remain available by disabling Flat bottom.
The heart, engraving depth, wave alignment, and mechanical geometry are retained.
See [the continuation audit](docs/subtle-band-verification.md) for actual swept
underside, sampled fine-line survival, and the remaining inner-tube layer-start
limitation in the inspected slicing profile.
