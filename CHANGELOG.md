# Changelog

## [Unreleased]

### Added
- Initial implementation of House Energy Bar.
- Support for 3 fixed generic segments with 1 required primary and 2 optional secondary entities each.
- YAML + editor support for `colors.background`, `colors.track`, and `colors.text`.
- Configurable `colors.divider` (YAML + editor) with default `#dbdde0`.
- Per-segment colors via `colors.segment1`, `colors.segment2`, and `colors.segment3` in YAML + editor.
- Optional divider toggle via `show_divider` in YAML + editor.

### Changed
- Fixed 3-segment generic layout.
- Secondary metrics are hidden when entity ids are empty.
- Added `track_blend` (same behavior range as PowerFlow Bar) for smooth segment color blending.
- Segment transitions now use smooth blended gradients between neighboring segments.
- Updated House Energy Bar defaults (layout/color/divider/transparent background) to the new baseline config.
