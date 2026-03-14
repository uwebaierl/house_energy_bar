# Changelog

## [Unreleased]

## [1.1.0] - 2026-03-14

### Changed
- Replaced the custom editor UI with Home Assistant's built-in `ha-form` editor styling.
- Replaced editor helper text with short, descriptive field labels for clearer default HA form layout.

## [1.0.0] - 2026-03-09

### Added
- Initial implementation of House Energy Bar.
- Support for 3 fixed generic segments with 1 required primary and 2 optional secondary entities each.
- YAML + editor support for `colors.background`, `colors.track`, and `colors.text`.
- Configurable `colors.divider` (YAML + editor) with default `#dbdde0`.
- Per-segment colors via `colors.segment1`, `colors.segment2`, and `colors.segment3` in YAML + editor.
- Optional divider toggle via `show_divider` in YAML + editor.
- Added `track_blend` (PowerFlow-style range/behavior) for smooth segment color blending.
- Smooth blended gradient transitions between neighboring segments.
- Updated default layout/colors (`track_blend: 0.15`, transparent background by default, divider off by default).
- README installation matches Battery Bar and PowerFlow Bar (HACS button + manual flows).
- Added screenshots and combined setup links to PowerFlow Bar and Battery Bar.
