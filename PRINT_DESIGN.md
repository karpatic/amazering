# Print-design foundation

This iteration adds dimensions and validation for comparing two treatments of
the same editable maze. It is a geometry study, not evidence of a safe,
support-free, or printer-ready object. The study baseline is a multi-material-
capable Bambu Lab P1S, a 0.40 mm nozzle, approximately 0.20 mm layers, and PLA.
These values support feature review; they are not a claim about extrusion width,
achievable clearance, physical fit, or print reliability.

## Selectable designs

All values below are millimetres. `printDesign.js` is the single source of these
parameters; the compact control above the editor reports the active values.

| Parameter | Existing design · reference | Bed-aligned comfort study |
| --- | ---: | ---: |
| Nominal bore diameter | 9.00 fixed | **18.00 default, editable** |
| Bore fit compensation | 0.00 implicit | **0.00 fixed** |
| Axial width | 10.00 | **11.00 PROVISIONAL** |
| Tube wall | 0.60 | 1.20 |
| Maze projection beyond tube | 0.40 | 0.80 |
| Wall overlap into tube | 0.10 | 0.30 |
| Circumferential wall, attached → exposed | 0.40 → 0.05 | 0.60 → 0.40 |
| Axial-wall physical thickness | 0.10 | 0.80 |
| Axial wall, attached → exposed run | 2.80 → 2.00 | 2.75 → 1.95 |
| Key radial clearance | 0.30 | 0.40 |
| Key axial clearance at next boundary | 0.00 | 0.15 |
| Sleeve axial width | 2.00 | 2.20 |
| Sleeve radial thickness | 0.60 | 1.20 |
| Sleeve / tooth axial height | 2.00 / 2.10 | 2.20 / 2.30 |
| Nozzle reference | 0.40 | 0.40 |
| STL orientation | Preserved legacy axes | Z up, minimum Z = 0 |

The reference preset intentionally reproduces the existing geometry, including
its legacy STL orientation and solid green/red 3D marker segments at the nominal
entrance and exit. Its 0.05 mm exposed circumferential tip and 0.10 mm axial wall
are below the nozzle reference and are surfaced as warnings, not silently
changed. A direct STL triangle comparison against `eb94380` found all 4,276
triangles identical at 0.000001 mm for the same fully populated probe maze.

The comfort study omits the solid marker segments so entrance and exit are real
channels. Its 18 mm default bore and 11 mm width are only provisional inspection
values, not a measured wearable size. Changing size adjusts the bore and its
dependent radii only; tube and maze-wall thicknesses, nozzle-related minimums,
and moving clearances do not scale. The sleeve is 0.20 mm wider axially than the
reference and has a thicker, chamfered radial section. The tube ends, sleeve
edges, wall profiles, and tooth planform are eased. This reduces sharp modeled
contact edges but does not establish ergonomic safety.

## Ring-size controls and source

The experimental design links a US ring-size selector to a nominal bore input.
Its listed half sizes use Blue Nile's first-party [How to Determine Your Ring
Size](https://bn-dam.services.r2net.com/assets/public/education/ring_sizer.pdf)
guide, retrieved directly with `curl` on 2026-09-05. The source labels the
measurements as ring inside diameters and publishes US/Canada half sizes 3
through 13.5 at diameters rounded to 0.1 mm.

Selecting a listed size applies its chart diameter exactly. A custom diameter
equal to a listed value resolves back to that listed size. A custom value
between chart entries gets an explicitly approximate US equivalent by linear
interpolation; values outside the chart's 14.1–22.6 mm range get no asserted US
equivalent. The 18.0 mm default is therefore shown as approximately US 7.9,
between the listed US 7.5 / 17.7 mm and US 8 / 18.1 mm entries, rather than being
called an exact US size.

The source also cautions that wider bands can feel tighter and may require a
larger size. This study is 11 mm wide, so the chart mapping is dimensional
context only and cannot establish wearable fit. The input is the nominal CAD
bore; fit compensation is a separate 0.00 mm parameter and is not silently
baked into the selected size.

## Cross-sections and coordinates

The SVG's horizontal edges become **circumferential boundary walls** around the
tube. Their actual radial cross-section is thick at the tube attachment and
tapers toward the exposed radius. The SVG's vertical edges become **axial
walls** along a maze row. Their axial run is longer at the tube attachment and
shorter at the exposed radius, producing sloped ends. These descriptions avoid
using the SVG's horizontal/vertical names as if they were print axes.

For the comfort study, end-boundary wall profiles are shifted inward so they do
not extend below the tube's axial ends. Toggling an edge destroys and regenerates
the complete 3D group from the active profile, so a newly exposed wall receives
the same tapered/rounded profile. Junction-specific squared support regions are
not modeled in this slice.

The experimental key sleeve and functional tooth both start on the exit-end
plane. The tooth reaches 0.10 mm above the sleeve and overlaps the sleeve
radially so those two key shells meet. The tooth remains 0.40 mm from the tube,
the sleeve remains 0.40 mm outside the maze envelope, and the tooth envelope has
0.15 mm nominal axial space before the next row wall. These are geometric model
spaces only; printed fit must be calibrated separately.

The bed-up exporter rotates the assembly axis onto Z and translates the result
to minimum Z = 0. In the generated study STL, both named assembly parts begin at
Z = 0: the inner maze ring through its tube, and the outer key through its sleeve
and tooth. The reference export remains selectable and unchanged.

## Validation and measured geometry

`validatePrintDesign` rejects malformed maze grids, closed entrance/exit model
flags, non-positive dimensions, wall overlap that consumes the tube, profiles
that span implausible neighboring rows, a key wider than its row, sleeve/tooth
separation, and tooth collisions with the tube-side row or column envelopes. It
does not clip maze paths or scale physical feature widths to make invalid inputs
appear valid. The UI pauses preview rebuilding and STL export while an edited
diameter is invalid; editing the diameter does not regenerate or replace the
maze state.

A direct Node/Three.js probe of the actual geometry exercised two listed sizes
on the same seeded 10 × 4 maze:

- US 6 / 16.5 mm input produced a 16.500000 mm tube bore and bed-up STL bounds
  `[-11.840864, -11.840864, 0]` to `[11.840864, 11.840864, 11]`.
- US 12 / 21.4 mm input produced a 21.400000 mm tube bore and bed-up STL bounds
  `[-14.288975, -14.288975, 0]` to `[14.288975, 14.288975, 11]`.

The bore measurement is twice the minimum XY radius of the exported bed-up tube
vertices. At both sizes the fixed 1.20 mm tube wall, 0.60 → 0.40 mm
circumferential profile, 0.80 mm axial wall, 0.40 mm moving radial clearance,
and 0.40 mm nozzle reference were preserved. A 6.0 mm custom bore was rejected
because the resting key tooth collides with an axial maze wall. This is a direct
geometry check, not slicer or printer evidence.

An ad-hoc Node/Three.js probe outside the repository generated a seeded 10 × 4
Aldous-Broder maze and real ASCII STL files from it:

- `/tmp/amazering-existing-reference.stl`: bounds
  `[-6.3649, -5.2, -6.3649]` to `[6.3649, 5.2, 6.3649]`, 2,912 triangles.
- `/tmp/amazering-bed-aligned-comfort-study.stl`: bounds
  `[-12.5903, -12.5903, 0]` to `[12.5903, 12.5903, 11]`, 9,656 triangles.
- `/tmp/amazering-geometry-report.json`: parameter validation, part bounds,
  triangle counts, and a welded-edge topology scan.

Both generated files had zero zero-area triangles in that probe. A 0.00001 mm
welded-edge scan still found 54 connected shells / 25 edges with more than two
incident faces in the reference and 52 shells / 21 such edges in the study.
Walls overlap the tube radially by 0.10 mm and 0.30 mm respectively, but the STL
is an assembly of intersecting shells rather than a demonstrated Boolean union.
It must not be described as manifold from this evidence.

## Physical calibration and next experiments

Before wear or sustained handling, inspect sliced paths and print small coupons
covering a range of radial and axial clearances on the P1S using the intended
PLA profile. Measure the resulting gaps, bore, wall tips, sleeve base, tooth, and
first-layer spread, then update geometry separately from printer compensation.
Check key travel through several mazes and inspect every finger-contact surface.
TPU remains a possible future protective-sleeve experiment only; it is not a
material switch or sleeve mechanism in the current model.

The reported history of maze walls cutting neighboring fingers remains an open
safety concern. Rounded CAD edges and a modestly wider sleeve are only risk-
reduction experiments; physical review is required. A sleeve as wide as the
inner ring was not added blindly: making the same functional tooth taller than
that sleeve would intersect multiple row boundaries. A later study should split
the protective sleeve from the short functional engagement region and evaluate
travel and neighboring-finger interference.

Further staged work includes a closed-end captive key, junction-aware supported
profiles, explicit wall-skipping checks, a bed-supported flared skirt,
configurable projection/profile experiments, smoother tessellation/finish, and
a heart decoration kept separate from the functional tooth.
