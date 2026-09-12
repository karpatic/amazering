# Subtle bands continuation — September 12, 2026

Author: Codex app agent

Carlos requested exact default `A - MAZE - RING`, and four thinner, smaller,
subtler decorative bands printable without supports. This continuation audited
HEAD `16b7bb9` plus the interrupted four-file patch; it did not restart the design.
The immediate dirty patch and source copies are in
`exports/2026-09-12-continuation/baseline/` (also `/tmp/amazering-continuation-baseline/`).
Historical exports, `result.json`, and guide SVGs were preserved.

| Dimension | HEAD | Local result |
| --- | --- | --- |
| Four paired wavy lines, width at sleeve | 1 mm | 0.6 mm |
| Raised band depth | +1 mm | +0.15 mm |
| Raised cross section | Rectangular | Tapered, 0.1 mm tip width |
| Text | `a - maze - ring` | `A - MAZE - RING` |
| Engraving / font size | −0.2 / 2.5 mm | Unchanged |
| Raised heart | +1 mm | Unchanged |
| Pair spacing / pair midpoint distance | 1.4 / 3.75 mm | Unchanged |
| Wave count / amplitude / alignment | 6 / 1 mm / 0° | Unchanged |
| Lower rim | Six dips, 1 mm | Flat by default; original waves configurable |

The taper extends through its embedded root; it does not reduce the specified
0.6 mm surface width. Negative depths retain rectangular engraving cutters;
zero omits bands. Both axial sides taper because bed-up export reverses model Y.
All four actual swept outward-facing lower surfaces have a minimum angle of
59.036° from horizontal, including wave travel and radial side bulges.
This is a default-specific measurement, not a guarantee for arbitrary controls.

The flat bottom is a narrowly scoped sleeve-rim adjustment, not a mechanical
redesign. A section 0.0001 mm above the bed changes from six disconnected regions
(total 0.0372 mm²) to one annulus (65.629 mm²). The original wavy version still
has six regions at 0.9 mm; it becomes one by 1.1 mm. Top dips and radial waves
remain unchanged. The UI explains the checkbox and only warns about a wavy
lower rim when it is actually enabled.

Verification artifacts are in `exports/2026-09-12-continuation/`:

- `geometry.mjs`, `geometry.json`: fresh exports, six cases, connected decorated
  sleeve solids; with decoration disabled and lower waves restored, exact
  historical geometry equality.
- `audit.py`, `audit.json`, `exports.json`: actual underside normals and bed
  sections; saved browser STL and 3MF match fresh fixture triangles to seven
  decimals (35,676 triangles). The prior browser harness was inspected, not run.
- `invariance.json`: inner tube, all maze walls, and functional tooth are exactly
  unchanged across flat/wavy base, absent/raised/engraved bands and phase changes.
  Phase 360° is exact default geometry; 90° changes only bands.
- `slice-inputs.py`, `slice-inputs.json`: meshes embedded in the saved sliced
  projects match fresh meshes within 0.0000012 mm; extracted G-code matches the
  archive byte-for-byte. This permits reuse of the actual prior slices.
- `approval-heart.png`, `approval-text.png`: fresh screenshots through the
  approved CUA browser lane, using the existing localhost tab. No new visible
  tab or direct browser attachment. Custom `aA - Maze` casing was checked and
  exact default restored. Opaque view and pause/orbit controls worked.
- `layers.py`, `layers.json`, `*-layers.png`: deposited-width footprint analysis
  of actual G-code. Arc paths are sampled at 0.03 mm; footprints are simplified
  at 0.003 mm. Starts are checked against the previous layer or earlier beads
  on the current layer, allowing half the current bead width plus 0.01 mm.
  This geometric diagnostic does not simulate adhesion, cooling, or extrusion.
- `fine-lines.py`, `fine-lines.json`: actual deposited outer contours compared
  with the no-band slice, corrected for each slicer's object translation and its 0x2 mm extruder offset.
  At 72 angular samples per line and ±0.35 mm around the modeled line center,
  all four lines show over 0.025 mm added radial contour at all 72 samples.
  Radial gains range from 0.111 to 0.161 mm. This supports fine-line survival
  at the sampled angles; it is not physical print certification. An intermediate
  comparison omitted the nozzle offset and was discarded.

Reused actual slicing evidence lives in
`exports/2026-09-12-subtle-supportless/{default,no-bands,wavy}-slice/`.
The embedded G-code identifies Bambu Studio 02.03.01.51, Bambu Lab P1S, PLA,
0.4 mm nozzle, 0.2 mm first and subsequent layers, supports disabled, Arachne,
no brim. There are 105 deposited layers. The mesh/G-code checks above, not
slicer exit status, establish which model was inspected.

The scoped local implementation and sampled band survival pass, but whole-ring
printability remains limited
by the retained inner-tube layer-start finding recorded below. No whole-ring
supportless claim or physical-print certification is made. Fine engraved text,
the retained raised heart, and moving clearances still need physical evaluation.
The configurable wavy bottom retains its separate bed-contact limitation.

Run the recoverable local preview with `./scripts/preview.sh` at
`http://127.0.0.1:5503/`. Nothing was published.

Layer-start results (105 layers in each slice):

| Slice | First-layer components / deposited area | Fully unattached later islands | Flagged starts |
| --- | --- | --- | --- |
| Wavy lower rim | 7 / 40.016 mm² | 0 | 2 at Z=0.4 mm |
| Flat bottom, four bands | 2 / 101.482 mm² | 0 | 1 at Z=0.4 mm |
| Flat bottom, no bands | 2 / 101.492 mm² | 0 | 1 at Z=0.4 mm |

The two flat first-layer components are the sleeve and inner tube. The flagged
flat-default start is G-code XY (131.520, 134.472), 1.672 mm from the previous
modeled bead footprint; the no-band start is (128.706, 135.074), 0.429 mm away.
Both are on the retained inner tube, below the decorative bands. These G-code
coordinates include the profile's `extruder_offset = 0x2`. The slice includes
circular scarf-seam settings; the first-layer inner-tube path has a gap. The
analysis flags a start, not a detached final layer island. Changing the retained
mechanism or tuning unrelated seam settings was outside this continuation.
Total centerline length beyond prior-bead contact is 11.7309 mm with bands
versus 11.7305 mm without; the wavy-bottom version is 154.426 mm.
These results do not justify a whole-ring supportless-ready claim.
