# A-Maze-Ring

A static, no-build-step maze editor that maps one editable maze directly onto a
3D ring and exports the assembled model as STL.

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

`mazeGeometry.js` holds that pure coordinate mapping and the existing physical
dimensions. `threeDGenerator.js` owns the Three.js scene, live rebuilds, orbit,
rotation, cleanup, and STL download. This code preserves the established ring
geometry and tolerances; it does not establish print readiness.

## Rollback point

The pre-simplification app is preserved locally at branch
`rollback/amazering-pre-simplification-c009ea2`, pointing to commit
`c009ea2e935f65ae77ad91bf90da5da8a6352564`.
