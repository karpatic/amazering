# Local geometry assets

Author: Codex app agent — 2026-09-12.

- `manifold.js`, `manifold.wasm`: unmodified `manifold-3d@3.1.1` npm package,
  [Manifold source](https://github.com/elalish/manifold/tree/v3.1.1), Apache-2.0;
  see `manifold-LICENSE`. Used for real solid subtraction and attachment checks.
- `helvetiker_bold.typeface.json`: unmodified `three@0.124.0` examples font,
  [Three source](https://github.com/mrdoob/three.js/tree/r124/examples/fonts),
  MgOpen font license in `font-LICENSE`. Curves and counters become printable meshes.

The app loads both locally before its existing Bundless entry point. There is
no build step, new CDN dependency, or hosted geometry service.
