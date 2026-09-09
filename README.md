# A-Maze-Ring

A static, no-build-step maze editor that maps one editable maze directly onto a
3D ring and exports the assembled model as STL or a single multipart 3MF.

## Run locally

Open `index.html` with VS Code Live Server, or serve this directory with a
simple static server and visit its root. All asset paths are relative so the
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
and bed-up STL / 3MF export. `threeMFExporter.js` packages five aligned named
parts: Maze walls, Tooth, Outer ring, Inner ring, and Tooth marker. Assign
filaments per part in Bambu Studio; keep the object together. Existing embedded
mesh overlaps need slicer review before multicolor printing.

The 3D panel also offers nine tooth-marker silhouettes: rounded dot (default),
pill, rounded square, heart, cross, X, cat head, flower, and rounded star.
Changing a marker preserves the maze and working tooth.

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
