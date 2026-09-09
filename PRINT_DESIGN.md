# A-Maze-Ring — accepted standard model

Carlos selected this design as the desired model after the physical-print
iterations and bottom-row correction. It is the app's sole active model,
not an experimental preset. The older reference preset is retired.

## Geometry contract

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
- Tactile locator: rounded outward bump behind the tooth, centered at Z 7.5 mm.
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
