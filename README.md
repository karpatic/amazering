# A-Maze-Ring

A static (no build step) 2D/3D maze generator you can use to export a 3D-printable ring.

## Quick start (local)

- VS Code Live Server: open `index.html` and click **Go Live**.
- Or run a simple static server:
  - `python3 -m http.server 8000`
  - then visit `http://localhost:8000/`

## GitHub Pages

This repo is designed to work both:

- locally at the site root (e.g. `http://localhost:5500/`), and
- on GitHub Pages under a project subpath (e.g. `https://<user>.github.io/amazering/`).

To make that work, `index.html` uses **path-relative** URLs for local assets/scripts (no leading `/`).

## Files

- `index.html`: page shell, layout, and pinned browser runtime
- `App.jsx`: shared SVG editor and live 3D preview layout
- `mazeGenerator.js`: SVG maze generation + editing
- `threeDGenerator.js`: 3D rendering + export
- `mazeutils.js`: shared helpers
- `*.jpg`: backgrounds/textures

## Notes

- A fresh page load generates one random maze through the same handler used by **Generate new maze**; later edits and rerenders do not trigger another maze.
- If you add new links/assets, prefer `./some-file.ext` or `some-file.ext` over `/some-file.ext` so the site keeps working on GitHub Pages under `/amazering/`.
- JSX is loaded by the published Bundless Babel browser runtime at `bundlessdev@1.0.12` (`dist/bundless.babel.min.js`). The Babel variant preserves the app's existing source semantics while Bundless resolves the local component imports.
