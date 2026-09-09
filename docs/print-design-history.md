# Archived design development

Historical trials and verification notes only. Superseded dimensions and
qualification statements below do not describe the accepted standard model.
See ../PRINT_DESIGN.md for the canonical current design. Old exports are
historical artifacts, not current build targets.

# Print-design foundation

## Current: bottom-row ramp allowance

The comfort tube is now **21.2 mm** tall, with **1.2 mm reserved below the
maze grid** for the bottom boundary's print ramp. The four-row grid retains
its **5.0 mm pitch**. The bottom wall stays at its former bed-relative height;
every other circumferential boundary moves upward 1.2 mm with its profile
unchanged. Bottom-reaching axial walls retain their former bed/ramp endpoints
and extend upward to the shifted grid. The pre-existing top-edge treatment
is unchanged; this is a bottom-row correction, not a redesign of all boundaries.

The outer sleeve remains 15 mm, tooth/dot midpoint remains Z 7.5 mm, wall
projection and exposed tooth reach remain 1.0 mm, and radial gaps are unchanged.
Geometry and resting-placement checks share the actual boundary-height helper.
Maze topology, reference preset and existing saved exports remain unchanged.

Ad-hoc real Three r124 / browser STLExporter r117.1 verification passed at
14.1, 18 and 22.6 mm bores: measured tube height 21.2 mm; actual section gaps
0.15 mm inside the wall tips matched bottom-to-interior at approximately
4.57 mm; circumferential profiles retained their expected translations;
axial lower/upper endpoint bounds, unchanged tooth/dot meshes, finite geometry,
zero degenerate triangles and 12,792-triangle STL exports passed. The saved
maze retained a clear starting placement and a fully blocked control warned.
These are sampled geometric checks, not full-motion or physical-print proof.
Evidence: `/tmp/hermes-verify-bottom-room-4ld0w2y_/`.
Browser verification also completed through the approved lane: the actual UI
shows 21.20 mm / 5 mm and 15 mm sleeve; current maze, bore, camera and rotation
setting were restored after the cache-token reload. Screenshot:
`/run/user/1000/services/chrome-devtools-lanes/lane-1/artifacts/160e0f8b-2576-4219-955b-6ee052223cde.png`.
The only observed console error was the missing favicon, not a geometry error.

## Retained: curved-face tooth with integral slanted underside

Replaced the sideways circular cylinder **and its separate gusset** with one
closed, angularly swept tooth. The radial/print-Z section has a full-height
sleeve attachment and a rising inward underside: nominal 1 mm rise per 1 mm
inward travel (45-degree main ramp). Its working face follows a concentric
cylinder around the tube, rather than a flat sideways-cylinder end. The
32-step angular sweep is circumscribed so facet interiors do not consume the
nominal tube gap; the residual faceting is below 0.0002 mm at checked bores.

- Restored nominal tooth-to-tube gap **0.18 mm** (was 0.23), giving exactly
  **1.00 mm exposed inward reach** from the sleeve's nominal inner radius.
  Attachment overlap is another 0.20 mm, so nominal total radial depth is 1.20 mm.
- Retained 18 mm default bore, 1.00 mm outward maze-wall projection, 0.18 mm
  sleeve gap, 15 mm sleeve height and the existing sleeve thickness/chamfers.
- Tooth overall Z bounds are **5.90–9.10 mm**, centered at **7.50 mm**. The
  unchanged external tactile dot is also centered at **7.50 mm**. The slant
  intentionally removes lower inward material: the unrounded tip face is
  Z 7.10–9.10 mm, not a full 3.2 mm circle centered on that midpoint.
- Existing `BaseDiameter`/`TipDiameter` fields remain 3.2 mm as the nominal
  attachment height/angular-sweep width, not a claim of a circular tooth.
  Exposed section corners use 0.12 mm quadratic corner setbacks, and the two
  angular end sections shrink 8% toward the section center for a small edge
  bevel. Embedded sleeve junction corners stay full-height. This retains a
  useful central working face while reducing lower/side contact and material.
- Placement checks now cover the entire swept ramp with conservative radial
  strips, including facet bulge and unrounded upper/lower bounds. Existing
  0.25 mm axial clearance, 0.03 mm wall allowance, actual-wall checks and
  no-safe-placement warnings remain; there is no cylinder or hidden gusset
  left outside that envelope. Maze topology and camera logic are unchanged.

Ad-hoc real Three r124 + the browser's r117.1 STL exporter checks passed at
14.1, 18 and 22.6 mm bores using the saved 10-column/4-row maze. At 18 mm,
measured facet-interior reach is 1.00000027 mm (floating-point tolerance),
working-face radii sampled at Z 7.5 are 9.780003–9.780067 mm, and ray gaps to
the actual faceted tube are 0.180155–0.191626 mm. Main underside slope in
export coordinates is -0.999990 rise/outward-run (approximately 45 degrees).
Each tooth has 396 vertices / 788 triangles, finite coordinates, zero
degenerate faces and two uses per indexed edge. Full assembly exports have
12,792 triangles and zero degenerate faces. The saved maze has a clear
resting placement in column 6 (zero-based 5) at all three bores; a fully
blocked control still triggers the do-not-print warning. Sampled real tooth
triangle interiors/edges remain inside the placement strip envelope. The
inner maze, sleeve and locator local meshes match the dirty baseline exactly.
Evidence: `/tmp/hermes-verify-amazering-bplytnto/` (`results.json`, `check.mjs`,
`bore-18.stl`, other bore STLs and `baseline/`). Existing repository exports
are untouched historical artifacts. Loader tokens are `comfort-curved-ramp18`.

**Trade-offs / limits:** returning to 0.18 mm reduces release margin by 0.05 mm
versus the preceding trial; the previous fusion report still matters. The
ramp removes lower engagement area; rounding and end bevels deviate locally
from the main 45-degree plane. This is not a support-free or print-qualified
claim. The tooth is one closed mesh, but tooth/sleeve/dot still overlap as
separate shells, not a verified Boolean union. Resting envelopes do not prove
all-motion clearance, anti-skip behavior, strength or comfort. Browser review
is left to the parent session; slicer and physical review are still required.
All trial descriptions below are historical and superseded where they differ.

## Previous: tooth reach fine adjustment

Added back 0.05 mm of inward reach at Carlos’s request: tooth-to-tube gap is
now 0.23 mm, between the original 0.18 mm and the preceding 0.28 mm trial.
Tooth diameter/vertical height stays 3.2 mm, centered at Z = 7.5 mm with the
outward dot. The sleeve remains 15 mm tall and walls project 1.0 mm.
Earlier trial dimensions below are historical.


## Centered tooth and release-clearance adjustment

Carlos reports the 15 mm sleeve works well and the 1.0 mm maze walls are the
right height. The tooth lightly fused to the inner tube and needed release.
The tooth and outward tactile locator now share the sleeve midpoint,
Z = 7.5 mm. The underside support follows the tooth. Inward reach is shortened
by 0.1 mm by increasing tooth-to-tube clearance from 0.18 to 0.28 mm; the
3.2 mm tooth diameter, 15 mm sleeve, 1.0 mm walls and 0.18 mm sleeve gap remain.
Placement checks use actual wall envelopes at this higher tooth position;
no maze walls are changed to force a fit. Older exports are historical.

Earlier sections below describe the preceding trials.


## Taller sleeve trial

Carlos reports the preceding print released after light fusion, initially ran
tight, then became mostly fluid with use. Rocking remained opposite the tooth.
At Carlos’s request, this trial increases sleeve axial height to 15 mm
(originally 7 mm, superseding the intermediate 10 mm candidate),
extending upward.
Tooth center and tactile locator remain at Z = 3.5 mm rather than moving with
the sleeve midpoint. Wall projection is reverted from 1.1 to 1.0 mm at
Carlos’s request. Maze height, topology, and tooth diameter remain unchanged.
The derived sleeve radii follow the lower wall envelope; nominal running gaps
remain 0.18 mm, so this is not an increase in radial clearance. The additional guiding length may reduce
tilt, but sparse wall support and added contact can still permit wobble or
increase drag. Reduced wobble requires confirmation on the next print.
Older export files are not updated by this source change.


## Tactile tooth locator

The comfort sleeve now has a rounded outward bump directly behind the tooth,
in the same moving assembly and at the same axial center. Its ellipsoid is
2.4 mm wide/tall and projects 0.4 mm beyond the sleeve at its center. It is
embedded 0.5 mm into the 0.8 mm sleeve without entering the running gap.
It exports with the key. This overlapping shell still requires slicer union
and first-layer/overhang review; tactile comfort awaits a physical sample.

## Current default and modest engagement adjustment

The app now starts with **Bed-aligned comfort study**, not the reference preset.
The first valid model receives a centered, elevated three-quarter camera view
(direction `1 : 0.65 : 1`), framed from its bounds using the narrower viewport
field of view and a 15% distance margin. This replaces the fixed `(0, 15, 15)`
initial view. Normal geometry rebuilds preserve camera, orbit target, zoom, and
model rotation; the view is not reset when editing the maze or selecting a size.

Changes from the immediately preceding cylindrical candidate (all mm):

| Quantity | Before | Now |
| --- | ---: | ---: |
| Solid cylindrical tooth, both end diameters | 3.00 | 3.20 |
| Maze radial projection beyond tube | 1.00 | 1.10 |
| Tooth radial span, including sleeve overlap | 1.20 | 1.30 |
| Sleeve inner / outer radius at 18 mm bore | 10.78 / 11.58 | 10.88 / 11.68 |
| Cylinder bed-up Z envelope | 2.00–5.00 | 1.90–5.10 |
| Local underside gusset run / rise | 0.80 / 0.80 | 0.60 / 0.60 |
| Gusset bed-up Z envelope | 1.350227–2.150227 | 1.441760–2.041760 |

“Taller walls” means radial projection, not axial width: the tube remains
20 mm tall, row pitch 5 mm for four rows, sleeve width 7 mm, and tooth center
Z = 3.5 mm. Bore remains 18 mm by default, tube and axial-wall thicknesses remain
0.6 mm, circumferential taper remains 0.6 → 0.4 mm, and nominal sleeve/tooth gaps
remain 0.18 mm with the unchanged 0.25 mm axial clearance requirement.

The existing proportional gusset would lose its bottom-wall clearance after
these increases. Its radial run is therefore capped at 0.60 mm while retaining
the 45-degree underside, 1.20 mm tangential width, and tooth/sleeve overlap.
This is a localized clearance accommodation, not a new support-free claim;
more of the inward cylindrical underside is unsupported and needs slicer review.
Wall profiles, maze topology, bore, placement selection, and validation margins
are otherwise unchanged. The reference geometry and inner tube export were
byte-identical to the immediately preceding dirty-source snapshot.

Bounded ad-hoc Three r124 mesh/STL verification on the saved 10-column / 4-row
maze selected the same zero-based column 8, with no placement warnings. Actual
triangle separation measured 0.454441 mm tooth-to-wall and 0.284257 mm
support-to-wall. The temporary STL has 11,160 finite, nondegenerate triangles
and 558,084 bytes. Both parts touch Z = 0; the tube ends at Z = 20 and sleeve
at Z = 7. Actual vertex radial checks at bores 14.1, 18, and 22.6 mm retain
positive sleeve gaps (0.174858–0.176538 mm) and tooth-to-tube gaps (~0.18 mm).
Joined/split seam runs and wall plans match before/after, inputs remain immutable,
and invalid/blocked cases retain errors or explicit review warnings. Node execution
of the exact rebuild block verifies first-view framing at three aspect ratios
and camera/target/rotation preservation on a subsequent rebuild; both JSX files
compile with Babel. This is not browser, slicer, physical, or all-motion proof.

Evidence and temporary review STL: `/tmp/hermes-verify-amazering-adjust-3k0krda1/`
(`verification.json`, `extra.json`, `opening-ramp-review.stl`). Browser interaction
and refresh were deliberately left to the parent session. Existing `exports/`
files were not updated and must not be described as this revision.

## Previous cylindrical preview revision

User-directed visual-review candidate: solid 3 mm cylindrical tooth; wall
projection 1.0 mm; tube and axial wall thickness 0.6 mm. Sleeve width remains
7 mm and tooth center remains 3.5 mm above the base. Tube chamfer is reduced
to 0.2 mm to preserve a flat edge on the thinner tube. Nominal sleeve/tooth
gaps remain 0.18 mm. The tooth radial span is 1.2 mm including sleeve overlap.

The sleeve now rotates to the nearest bottom-row cell with an open upward
passage (exit first when suitable; equal-distance ties use the lower column).
Geometry and validation share an actual-wall-aware, full tooth/support envelope
assessment. Missing walls no longer produce a nominal first-band warning.
No upward passage, blocked neighboring walls/clearances, single-row layouts,
or unsupported support dimensions retain an explicit review warning and marked
fallback placement; no maze wall is changed. Structural dimension errors remain.

A localized underside gusset at the sleeve attachment adds a 0.8 mm radial/run
by 0.8 mm rise, 45-degree slope, 1.2 mm tangential width. It overlaps the tooth
and sleeve, retains the complete solid 3 mm cylinder and leaves its innermost
0.4 mm free of the gusset. Support height is 1.350–2.150 mm; sleeve remains
bed-aligned at 0–7 mm, cylinder remains at 2–5 mm. This is an overlapping shell,
not a Boolean union or a claim that the entire cylindrical overhang is supported.

Focused Three r124 mesh/STL execution on the saved 10-column / 4-row maze
selected column 8 (zero-based), one cell from exit 7. The nearest actual wall
separations were 0.654 mm for the cylinder and 0.290 mm for the support.
11,160 triangles were finite and nondegenerate. Inner-maze and reference STL
were byte-identical to the pre-edit snapshot. This is resting-geometry evidence,
not slicer, physical-print, comfort, or all-motion qualification.
Browser verification was unavailable: stopped Chrome lanes were left untouched.
The existing `exports/A-Maze-Ring-next-print-bed-up.stl` and accompanying report
remain the prior design, not this candidate. Review artifact and evidence are
outside the repo in `/tmp/hermes-verify-amazering-opening/`; current source is
served with the `opening-ramp` cache token.


## Historical small fit adjustment

The current UI uses only the US ring-size dropdown; the separate diameter input
was removed. Existing custom fit is preserved until a listed size is chosen.
The comfort sleeve is now 7.00 mm tall with a 0.18 mm nominal sleeve gap. The
conical tooth has a 3.00 mm circular base and remains centered 3.50 mm above the
bed; its blunt tip remains 0.50 mm. Tooth-to-tube gap stays 0.18 mm and maze
height stays 20 mm. The required axial margin is now 0.25 mm rather than 0.60 mm
to accommodate the larger, higher tooth. This revision is not physically tested.

Joined bottom axial-wall ends now follow the shifted circumferential wall's
lower ramp, rather than carrying a flat slab through it. Unjoined bed ends and
other junctions retain their profiles. A focused actual-Three.js check on the
captured 18 mm / 10-column / 4-row maze measured sampled underside margins of
-0.799555 mm before and +0.001875 mm after (282 after samples). This is sampled
geometry evidence, not exhaustive surface-containment or print qualification.
The existing-reference STL remained byte-identical. The refreshed next-print
STL uses that captured maze: 11,152 triangles, finite coordinates, no zero-area
triangles, overall Z 0–20 mm, and tooth Z 2–5 mm. Its companion JSON records the
source hashes and evidence. Browser inspection also showed the bottom bars no
longer breaking through the circumferential underside. Detailed measurements
below are historical and do not describe this latest revision.

## Previous measured revision

This repository contains two selectable geometry treatments of the same editable
maze. The bed-aligned comfort study described below is an **unprinted geometry
study**. Its checks establish numeric CAD clearances for the generated triangles;
they do not establish printer qualification, support-free printing, safe wear,
strength, or reliable anti-skip motion.

The study baseline remains a multi-material-capable Bambu Lab P1S, a 0.40 mm
nozzle, approximately 0.20 mm layers, and PLA. Those values are review context,
not printer compensation. The nominal bore is editable; all other study values
are provisional literals in `printDesign.js`.

## Current selectable designs

All values are millimetres. The right column is the current unprinted revision.

| Parameter | Existing design · reference | Bed-aligned comfort study |
| --- | ---: | ---: |
| Nominal bore diameter | 9.00 fixed | **18.00 default, editable** |
| Bore fit compensation | 0.00 implicit | **0.00 fixed** |
| Axial width | 10.00 | **20.00 PROVISIONAL** |
| Row pitch for a 4-row maze | 2.50 | **5.00** |
| Tube wall | 0.60 | 0.80 |
| Maze projection beyond tube | 0.40 | 0.80 |
| Wall overlap into tube | 0.10 | 0.30 |
| Circumferential wall, attached → exposed | 0.40 → 0.05 | 0.60 → 0.40 |
| Axial-wall physical thickness | 0.10 | 0.80 |
| Axial run, attached → exposed | 2.80 → 2.00 fixed | **5.00 → 4.45 pitch-derived** |
| Axial-run setback at each end, attached / exposed | n/a | **0.00 / 0.275** |
| Sleeve offset beyond nominal wall path | 0.30 | **0.21** |
| Actual sleeve gap beyond swept wall vertices, measured | not reclassified | **0.202455** |
| Tooth gap beyond tube | 0.30 | **0.18** |
| Required tooth-to-next-wall axial margin | 0.00 | **0.60 minimum** |
| Sleeve axial width | 2.00 | **5.70** |
| Sleeve radial thickness | 0.60 | 0.80 |
| Tooth form | 2.00 × 2.10 box | **circular frustum, 2.40 base / 0.50 blunt tip** |
| Tooth radial span / sleeve overlap | 1.00 / 0.20 | **1.03 / 0.20** |
| Tooth Z envelope / center in bed-up export | legacy axes | **1.65–4.05 / 2.85** |
| Nozzle reference | 0.40 | 0.40 |
| STL orientation | Preserved legacy axes | Z up, minimum Z = 0 |

Changing the study bore adjusts its dependent radii only. The 0.80 mm tube wall,
0.80 mm wall projection, 0.30 mm attachment overlap, wall thicknesses, axial
setbacks, sleeve width, tooth diameters, and moving gaps do not scale with the
bore or the taller axial width. The sleeve and tooth gaps are intentionally
separate. Neither is a measured printer clearance.

The 0.21 mm sleeve offset is intentionally tighter than the earlier 0.25 mm
value, but it is not pushed to a nominal 0.15 or 0.10 mm. The actual Catmull-Rom
wall sweep reaches radius 10.607545 mm rather than stopping at the nominal
10.600000 mm wall path. The sleeve's measured 10.810000 mm inner radius therefore
leaves 0.202455 mm against actual wall vertices. The tooth-to-tube gap is reduced
from 0.20 to 0.18 mm. These modest changes respond to the loose, shallow earlier
engagement while retaining nonzero model space; first-layer spread and extrusion
variation can still fuse or bind the moving parts. Print coupons remain required.

## Height, row pitch, and axial runs

The study tube is 20.00 mm tall around the unchanged 18.00 mm bore. With the
unchanged logical 4-row maze, the actual row pitch is 5.00 mm. Axial-wall run
lengths are no longer detached 2.50/1.95 mm literals:

- attached single-row length = `row pitch - 2 × 0.00` = 5.00 mm;
- exposed single-row length = `row pitch - 2 × 0.275` = 4.45 mm;
- every additional touching row extends the one merged profile by exactly one
  5.00 mm pitch.

Only the two real ends of a merged axial run receive the rounded/tapered end
treatment. A missing row ends a run. In the actual r124 probes, one segment and
three touching segments each emitted one 52-face mesh; the three-row plan added
exactly 10.00 mm to the single-row extension. A two-plus-one probe emitted two
meshes and retained a 4.797220 mm gap between their complete mesh bounds. The
bed-reaching run keeps its approved square supported end.

The existing 0.15 mm rounded wall edges, asymmetric 0.80 by 0.80 mm support
ramps, radial recess, one-arm cap extension, and merged-through junction cleanup
remain in place. At the exact saved row-1/column-7 crossing, 34 wall cells still
become 26 circumferential runs; the merged run has no crossing cap and no mesh
boundary edges. These local overlaps are not a Boolean union.

## Wide sleeve and raised inward tooth

In bed-up coordinates the sleeve starts at Z = 0, ends at Z = 5.70, and is
centered at Z = 2.85. It therefore passes completely across the first nominal
wall band around Z = 5.00 instead of sitting as a narrow band between wall
bands. Its inner surface remains outside the actual swept wall envelope by the
measured 0.202455 mm above.

The requested “about one maze unit above the bed” is implemented as the
sleeve-centred lower-channel engagement position, Z = 2.85 mm. For clarity, that
is **0.57 of the current 5.00 mm row pitch**, not a claim that 2.85 mm equals one
full current grid row. It is also 1.14 times the historical 2.50 mm row pitch.
This interpretation keeps the tooth centered axially in the 5.70 mm bed-on
sleeve while the logical four-row maze remains unchanged.

The functional tooth is a true circular conical frustum; it is not an ellipse
scaled to the sleeve width. Its 2.40 mm diameter base is embedded 0.20 mm into
the sleeve and its 0.50 mm diameter blunt face points radially inward toward the
tube. The blunt face is an explicit robustness compromise: it is less fragile
than a zero-radius apex, but it provides shallower local engagement than a sharp
point. Three's local positive cone axis is rotated `+π/2` about Z, so the small
end is at the 9.98 mm inner radius and the broad base is at the 11.01 mm outer
radius. The previous `-π/2` direction pointed outward and is not retained.

The tooth is intentionally **not bed grounded**. Its full exported envelope is
Z = 1.65–4.05 mm, centered at Z = 2.85 mm. At the sleeve inner face its underside
emerges at Z = 1.834466 mm, then rises 0.765534 mm over 0.83 mm of unsupported
radial reach to the blunt-tip underside at Z = 2.60 mm. That lower generatrix is
42.686 degrees above the build plate. The curved underside and elevated start
are an overhang/support tradeoff: a slicer may require support or carefully
qualified bridging/overhang settings. Nothing in this geometry check establishes
support-free printing.

## Ring-size controls

The experimental selector continues to use Blue Nile's first-party
[How to Determine Your Ring Size](https://bn-dam.services.r2net.com/assets/public/education/ring_sizer.pdf)
chart, retrieved directly on 2026-09-05. Listed US/Canada half sizes 3 through
13.5 use the source's inside diameters rounded to 0.1 mm. Exact listed diameters
map to their chart size; in-range values between entries are visibly labeled as
linear interpolations. Values outside 14.1–22.6 mm get no asserted US equivalent.

The source cautions that wider bands can feel tighter. This study is now 20 mm
axially, so the chart is dimensional context only and cannot establish wearable
fit. The 18.0 mm default is approximately US 7.9, not an exact chart entry.

## Current geometry verification

A focused Node probe used actual Three.js r124 `Geometry`/`BufferGeometry` and
the matching STL exporter. It used the exact maze embedded in the prior export's
verification JSON—10 columns, 4 rows, entrance 9, exit 7—with no random maze
generation. The current binary STL has:

- 12,008 triangles and 600,484 bytes, exactly `84 + 12,008 × 50`;
- finite coordinates and zero zero-area triangles at a squared-area threshold
  of `1e-18`;
- bounds `[-11.609999657, -11.609999657, 0]` to
  `[11.609999657, 11.609999657, 20]` mm;
- an actual measured bore of 17.999999284 mm, 0.000000716 mm below nominal
  from exported float/tessellation precision;
- inner-part Z bounds 0–20 mm, key-part Z bounds 0–5.70 mm, and tooth bounds
  1.65–4.05 mm;
- SHA-256 `fcba5d3a9de9a4d5cac1ef58b414d74e1e70b5ded62d2102a6365c0fd2fb34ea`.

The full circular tooth envelope was checked over radius, tangent, and axial
directions. Actual mesh rim deviation from the requested circles was at most
`4.77e-8` mm (float/tessellation precision). At the start-channel center:

- tooth-to-tube radial space measured 0.180000 mm;
- sleeve-to-actual-wall radial space measured 0.202455 mm;
- the sampled tooth-to-first-wall axial margin was 1.080000 mm;
- the sampled tooth-to-side-wall tangential margin was 2.053735 mm;
- a deterministic stress probe made from the exact saved maze plus the first
  boundary and both exit-row side walls measured 0.783606 mm minimum distance
  between the actual tooth and wall triangles.

The exact export maze is less constrained than that stress probe: its first
boundary wall and both exit-row side walls are all absent. The tooth is centered
in the exit channel, and the wide sleeve cannot wedge between adjacent axial
wall bands, but sparse walls and tilt can still permit off-center travel or
skipping. Centered depth alone is not evidence of all-motion anti-skip retention.
A kinematics suite was deliberately not introduced for this focused revision.

The validation tolerances above are numerical geometry tolerances, not printer
uncertainty. Nominal 0.18–0.21 mm moving spaces are of the same order as a layer
height and below the 0.40 mm nozzle diameter; extrusion, shrinkage, seam, and
first-layer variation can dominate them.

## Reference preservation

Before editing, all six dirty tracked files and both exports were copied to
`/tmp/hermes-verify-backup-5M23m6`. For the exact saved maze, the reference
preset's literal object bytes were identical before and after this revision
(SHA-256 `61eddfd75a37cde3815fa143528be312a0bf07e4fc65a8acf49fc02c8f508d02`).
Its actual mesh tree had identical object/geometry counts, transforms, and
vertices, and its 3,024-triangle binary STL was byte-identical (SHA-256
`df1b13ce9356aff5f27ec22bcf79d698720c02701ba4b780b5d8e6eab6dc302a`).
The reference still contains its legacy marker segments and legacy STL axes.

## Historical printed prototype — not current evidence

The previously printed next-print STL is preserved in the external backup. Its
verified SHA-256 is
`7230a91f2380d518f4dbdd210e56f836f7e2e8cab26f4a536836cd2e80f51564`,
matching the successful physical prototype reported by the user. That STL used
the earlier 10 mm tube and 1.90 mm sleeve. Its JSON records source hashes
`9e190df6…` for `mazeGeometry.js` and `4537a10f…` for `printDesign.js`. The dirty
source found immediately before this revision already differed
(`9f0d784a…` / `648517e0…`) and contained the outward, elliptically scaled cone.
Therefore the old record did not even prove that intervening pre-edit geometry,
and it does **not** verify the current unprinted 20 mm / 5.70 mm /
inward-frustum revision.

Earlier checks recorded in the backed-up verification JSON are likewise
historical. They remain useful regression context for the wall profiles and
junction cleanup, but any old dimensions, triangle counts, bounds, screenshots,
or browser-rebuild observations must not be presented as current evidence.

## Remaining physical work and limitations

The exported STL is an assembly of intersecting tube, wall, sleeve, and tooth
shells. The checks confirm contact/overlap where intended and find no zero-area
triangles; they do not prove a Boolean-unioned manifold solid. The chamfered tube
still has only a 0.20 mm radial flat at the bed. Slicer inspection remains
required for shell interpretation, first-layer behavior, raised-tooth support,
wall paths, and material assignment.

Before wear or sustained handling, print separate clearance/overhang coupons
using the intended P1S PLA profile, then measure the bore, sleeve gap, tooth gap,
blunt tip, wall tips, and first layer. Inspect every finger-contact surface and
test travel through the exact maze under controlled axial offset and tilt. The
reported history of maze walls contacting neighboring fingers remains an open
safety concern; rounded CAD edges and the wider sleeve reduce modeled sharpness
but do not establish ergonomic safety.
