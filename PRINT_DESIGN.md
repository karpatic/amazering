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
  Its face is enlarged 50%: the default dot spans 3.6 mm instead of 2.4 mm.
  The radial scale remains 0.45; only the face scale changed from 1.2 to 1.8.
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
| Tooth marker | 1, or any chosen filament |

Slots are a suggested manual mapping, not encoded printer/AMS assignments.
No printer profile, painted triangles or preselected colors are included.
The file has five named Core 3MF mesh resources plus one components/build item,
with minimal `Metadata/model_settings.config` part-name metadata for Bambu.
The [3MF Core specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md)
defines the assembly; Bambu's [3MF importer/exporter source](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp)
reads part IDs and `name` metadata (core mesh names alone can be replaced by
assembly-name fallbacks).

This preserves the existing triangle surfaces exactly, including embedded
wall/tube, tooth/sleeve and locator/sleeve overlaps; it is not a Boolean union.
Review material ownership at overlapping parts, repaired shells, first layers
and moving gaps in the slicer before printing. Ad-hoc Three r124 checks on the
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
Sleeve height is `0.75 × (height − 1.2)` mm, with the tooth and tactile dot at
its midpoint. The default remains exactly 21.2 / 15 / 7.5 mm. Radial walls,
tooth profile and running gaps are unchanged. Column limits retain positive
shared-envelope tangential room at the chart's smallest bore; wall-dependent
resting-placement warnings remain authoritative, not a printability guarantee.

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
