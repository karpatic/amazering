# Decorative wave alignment and signed depth

Author: Codex app agent — 2026-09-12

Wave alignment is visible only for Wavy decorative bands. Its 0–360° range
represents one wave cycle, default 0°. All decorative bands share the added
phase; 90° places a crest at the fixed marker, 180° reverses crests/troughs,
and 360° is normalized to exactly 0°. Straight hides the control, retains
its draft, and ignores the offset. Sleeve rotation, marker, lettering, radial
side bulges and axial rim waves are independent.

Band depth keeps its +1 mm default and −0.2 to +1 mm range. Nearby help reads
“Negative engraves / Positive raises / 0 none” and gives the range. Browser
keyboard entry of `-`, `.`, `2` already retained the negative draft correctly;
the actual failure was a collapsed triangle during engraving conversion.
Two Float32 vertices only about 0.00000012 mm apart straddled a rounding-cell
boundary. The weld now searches adjacent cells within the existing 0.000001 mm
tolerance. Finite coordinates, noncollapsed faces, closed oriented edges,
solid attachment, protected engraving floor, and stale-export guards remain.

Local evidence is in `/tmp/amazering-alignment-evidence/`; checks use an isolated
headless Chrome profile at `http://localhost:5503/`, without a visible browser
window or attachment to Carlos's logged-in browser. Existing `exports/` files,
guide SVGs, and historical notes are preserved. This change is local only.

## Focused verification results

- Fourteen real browser STL/3MF download pairs match preview triangles at
  seven decimal places: Wavy at −0.2, 0 and +1 mm × 0°, 90°, 180°, 360°;
  Straight at +1 mm × 0°, 90°. ZIP CRC and XML parsing pass.
- Radial samples at all four band centers and three angular positions per
  phase measure 0.2 mm removal and 1 mm raised height within 0.001 mm;
  sampled groove floors retain more than 0.54 mm. Engraving reduces the
  sleeve volume and produces no raised-band resource. Relief meshes have
  finite, noncollapsed triangles and closed, consistently oriented edges.
- Shared band centerlines follow the phase at the marker and quarter-cycle
  samples. Marker, lettering, and mechanical meshes remain fixed. 360° equals
  0° exactly; zero-depth geometry is phase-invariant and equals no bands.
  Straight raised exports and a separate straight-engraving check are invariant.
- Original defaults and the complete default mesh exactly match commit
  `6626bc8`. Keyboard `-`, `.`, `2` completes `-.2`; keyboard 0 and 1 work.
  Incomplete and out-of-range drafts block exports and recover when corrected.
- Maze/view preservation, hidden/retained straight phase, forced kernel failure,
  stale STL/3MF prevention, recovery, automatic transparency and its 0–30%
  range/manual override pass. No browser page errors or mobile overflow.

Screenshots, representative real export pairs, check scripts and JSON results
are retained locally in `exports/2026-09-12-wave-alignment/` (untracked).
See its `README.md` for all eight phase images and desktop/mobile controls.
The test's original exact-label selector missed the existing style dropdown;
only the remaining straight/UI checks resumed in a fresh headless session.
No physical print or new slicer qualification is asserted.
