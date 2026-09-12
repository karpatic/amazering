# A-Maze-Ring

A static, no-build-step maze editor that maps one editable maze directly onto a
3D ring and exports the assembled model as STL or a single multipart 3MF.

## Run locally

Open `index.html` with VS Code Live Server, or serve this directory with a
simple static server and visit its root. `./scripts/preview.sh` serves the app at
`http://127.0.0.1:5503/`. All asset paths are relative so the
same files work locally and under the GitHub Pages `/amazering/` subpath.

The app intentionally keeps its published Bundless Babel integration in
`index.html`; `App.jsx` is the browser entry point.

## Data flow and coordinates

`App.jsx` owns the only maze state. `mazeModel.js` generates and immutably edits
that model, then the SVG editor and 3D preview read the same object.

- `horizontalWalls[boundaryRow][column]` stores every horizontal edge once.
  Boundary row `0` is the entrance end and `rows` is the exit end.
- `verticalWalls[row][column]` stores the wall to the left of a cell. Column `0`
  is the cylindrical seam, so the SVG's left and right endpoints edit the same
  value.
- SVG row `r` maps directly to positive-to-negative model Y; column `c` maps to
  angle `c × 2π / columns`. There is no row reversal or wall-slot swapping.

`printDesign.js` owns the accepted standard model, its millimetre parameters,
derived dimensions, and geometry validation. The old reference preset is
retired; the app has one model and retains adjustable ring sizing.
`mazeGeometry.js` maps the maze into the shared Three.js model.
`threeDGenerator.js` owns the scene, live rebuilds, orbit, rotation, cleanup,
and bed-up STL / 3MF export. `threeMFExporter.js` packages aligned named
parts: Maze walls, Tooth, Outer ring, Inner ring, and optional raised Tooth marker,
Decorative bands and Sleeve lettering. Engraving belongs to the Outer ring. Assign
filaments per part in Bambu Studio; keep the object together. Existing embedded
mesh overlaps need slicer review before multicolor printing.

The 3D panel offers None or nine tooth-marker silhouettes, defaulting to a raised
heart. Signed marker, band and text depths raise or actually engrave the sleeve.
The new aesthetic awaiting Carlos’s approval uses four 0.6 mm wavy bands at
+0.15 mm with tapered sides, six cycles with 1 mm up/down travel, six 1 mm side bulges and six 1 mm inward
top-edge dips and a flat lower rim for bed contact (lower waves remain
configurable). Exact uppercase `A - MAZE - RING` is engraved 0.2 mm at 2.5 mm
font size. See the [continuation audit](docs/subtle-band-verification.md) for
sliced evidence and unresolved printability limitations.
Band count supports 0–5; pairs expose spacing and distance controls. Counts 1,
3 and 5 place independent text drafts above/below the center band. Other counts
retain the second draft while showing the first at the middle. Nominal fit
warnings never shrink requested text or block otherwise valid geometry.
Actual solid failures still pause preview and guard against stale exports.
Wavy decorative bands also offer Wave alignment: 0–360° of one cycle relative
to the fixed marker, default 0°. Straight retains the offset but ignores it.
See [wave alignment verification](docs/wave-alignment-verification.md).

Rendering is followed by Appearance, the existing Visual guide and design inputs.
The guide screenshots are earlier examples and will not be remade until aesthetic
approval. See PRINT_DESIGN.md for exact defaults, placement and print limitations.

The standard has a 21.2 mm inner tube, 15 mm outer sleeve, full-height bottom
passage, curved/ramped tooth and outward tactile locator. Walls project 1 mm
outward and the tooth reaches 1 mm inward. Carlos selected this design as the
winner after the print iterations; it is no longer an experimental study.

See [PRINT_DESIGN.md](PRINT_DESIGN.md) for the canonical dimensions and
verification boundaries. The printing setup is a Bambu Lab P1S, PLA, a 0.4 mm
nozzle and approximately 0.2 mm layers. Check slicing and fit when changing
size or print settings. Superseded designs and measurements live in the
[archived development notes](docs/print-design-history.md).

## Rollback point

The pre-print-design app is preserved locally at branch
`rollback/amazering-pre-print-design-eb94380`, pointing to commit
`eb94380125b2e147955523ab60d0f325d305f073`.

The pre-simplification app is preserved locally at branch
`rollback/amazering-pre-simplification-c009ea2`, pointing to commit
`c009ea2e935f65ae77ad91bf90da5da8a6352564`.
