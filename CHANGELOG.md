# Changelog

## [Unreleased]

### Changed
- Standardized the shared top-row layout tokens to a `4px` line gap and a `15px` / `500` primary metric baseline so House Energy Bar aligns more closely with Battery Bar and PowerFlow Bar in stacked layouts.
- Moved the remaining shared metric/button styling tokens into the common layout token layer, including primary and chip spacing, focus ring styling, primary text rhythm, and icon tint/offset values.
- Normalized chip text weight into the shared token layer and explicitly exposed `--icon-primary-color` on metric icons so the icon component inherits the card color path consistently.

## [1.2.0] - 2026-03-25

### Release Summary
- Added shared color presets with semantic color tokens and preset-owned `track_blend`.
- Removed card-side icon and decimal fallback logic so icons and value formatting now come directly from Home Assistant entities.
- Added an optional PV lead segment and standardized semantic YAML entity names.
- Updated the visual editor with aligned form sections, seeded manual overrides, improved YAML cleanup, and a cleaner chooser/editor preview.

### Changed
- Removed the forced full-width preview placeholder wrapper so the chooser/editor description centers correctly.
- Shortened the chooser/editor preview description so House Energy Bar aligns more evenly with the other card previews.
- Fixed the incomplete-config preview so House Energy Bar now shows only the centered description text instead of text plus an empty bar shell.
- Fixed the chooser/editor preview refactor so the normal House Energy Bar layout keeps its full-width section grid instead of collapsing into a broken wrapped column.
- Aligned the incomplete-config chooser/editor preview with the other cards and moved repeated editor color-state and selector-range helpers into shared workspace modules.
- Removed prefilled example entity ids, removed hardcoded metric fallback labels/titles, and made preset colors the only semantic color baseline outside explicit manual overrides.
- Removed the remaining legacy decimal cleanup and raw-state formatting fallback so displayed values now rely only on Home Assistant's entity formatting.
- Removed hardcoded metric icon fallbacks so visible icons now always come from the configured Home Assistant entities.
- Added an optional PV lead segment for House Energy Bar, including a `show_solar_segment` toggle at the top of `Entities`, semantic YAML keys (`entities.pv_*`, `entities.grid_import_*`, `entities.battery_output_*`, and `entities.grid_export_*`), and `colors.energy_source` support in presets and manual overrides.
- Added a `fade_between_segments` toggle in the Colors section as an opt-in control; the default rendering now keeps solid boundaries between segments unless the toggle is enabled.
- Stopped persisting default `colors.background` in YAML from the visual editor when no explicit background override is set.
- Updated the shared `Industrial`, `Coffee`, `Ocean`, and `Forest` preset palettes, including their `text_light` and `text_dark` values.
- Added shared `text_light` and `text_dark` color tokens with automatic contrast-based text selection, while migrating legacy `colors.text` overrides to both tokens.
- Seed the manual color override fields with the currently effective hex values when color overrides are enabled in the visual editor.
- Merged the editor `Colors` section into the same Home Assistant `ha-form` panel stack as the other sections so section spacing now matches the native expandable layout.
- Finalized the shared preset labels and token values for `Industrial`, `Coffee`, `Ocean`, and `Forest`; `Classic` remains unchanged.
- Fixed the editor so `colors.background` stays independent from manual semantic color overrides and no longer flips the override toggle on by itself.
- Restored `track_blend` as an optional manual override, exposed it in the Colors section when custom overrides are enabled, and kept the `0.10..0.40` range.
- Normalized unavailable metric handling so configured entities stay visible as `—`, while optional empty entity slots remain hidden.
- Switched value formatting to Home Assistant's native entity formatter and removed the card-specific decimal controls from docs/editor output.
- Added shared `color_preset` support with the same global semantic token model used by Battery Bar and PowerFlow Bar.
- Replaced per-segment preset colors with semantic `colors.*` tokens for the fixed House slots (`grid_import`, `energy_storage_supply`, and `grid_export`, plus shared background/track/text/divider colors).
- Added automatic migration for legacy `colors.segment1`, `colors.segment2`, and `colors.segment3` overrides.
- Fixed the three House Energy segments to their intended semantics: Segment 1 = Grid Import, Segment 2 = Battery Supply, Segment 3 = Grid Export.
- Updated the visual editor with a dedicated Colors section that includes the preset selector and the shared manual override toggle, and removed the now-unneeded semantic mapping dropdowns.
- Replaced `preset_2` to `preset_5` with new cohesive palettes: Utility, Solar Warm, Ocean, and Forest. `preset_1` remains unchanged.
- Removed `background` from shared presets and moved background editing into the Layout & Motion section of the editor.

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
