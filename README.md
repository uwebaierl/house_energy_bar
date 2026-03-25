# House Energy Bar

<img style="max-width: 1000px; width: 100%; height: auto;" alt="House Energy Bar Overview" src="https://raw.githubusercontent.com/uwebaierl/house_energy_bar/main/docs/images/house_energy_bar_01.png" />

House Energy Bar is a compact Home Assistant Lovelace card with 3 core semantic segments and an optional PV segment on the left.

## Features

- Compact daily totals card for grid import, battery output, and grid export, with an optional PV lead segment
- Primary metric plus up to two secondary metrics per segment
- Shared preset-based color themes with optional manual overrides
- Built-in visual editor for layout, colors, and entities
- Clickable values that open Home Assistant `more-info`
- Missing or unavailable configured entities stay visible as `—`, while empty optional slots stay hidden
- Uses Home Assistant's native localized state formatting
- Adjustable height and corner radius for compact dashboard layouts
- Adjustable height and corner radius to match [Bubble Card](https://github.com/Clooos/Bubble-Card) layouts cleanly

## Combined Setup

House Energy Bar works well together with [PowerFlow Bar](https://github.com/uwebaierl/powerflow_bar) and [Battery Bar](https://github.com/uwebaierl/battery_bar) when you want a compact 3-card energy stack.

<img style="max-width: 1000px; width: 100%; height: auto;" alt="House Energy Bar combined setup" src="https://raw.githubusercontent.com/uwebaierl/house_energy_bar/main/docs/images/house_energy_bar_combined_01.png" />

For the complete setup, also see:

- [PowerFlow Bar](https://github.com/uwebaierl/powerflow_bar) for PV, battery, home, and grid flow.
- [Battery Bar](https://github.com/uwebaierl/battery_bar) for per-battery SoC, voltage, and temperature details.

## Installation

### HACS (Recommended)

- Add this repository via the link in Home Assistant.

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=uwebaierl&repository=house_energy_bar&category=plugin)

- **House Energy Bar** should now be available in HACS. Click `INSTALL`.
- The Lovelace resource is usually added automatically.
- Reload the Home Assistant frontend if prompted.

### HACS (manual)

1. Ensure HACS is installed.
2. Open HACS and add `https://github.com/uwebaierl/house_energy_bar` as a custom repository.
3. Select category `Dashboard`.
4. Search for **House Energy Bar** and install it.
5. Reload resources if prompted.

If HACS does not add the resource automatically, add this Dashboard resource manually:

```yaml
url: /hacsfiles/house_energy_bar/house_energy_bar.js
type: module
```

### Manual Installation

1. Download `house_energy_bar.js` from the [Releases](../../releases) page.
2. Upload it to `www/community/house_energy_bar/` in your Home Assistant config directory.
3. Add this resource in Dashboard configuration:

```yaml
url: /local/community/house_energy_bar/house_energy_bar.js
type: module
```

## Card YAML

```yaml
type: custom:house-energy-bar
bar_height: 56
corner_radius: 28
# Optional: enable this to show the PV lead segment
show_solar_segment: false
background_transparent: true
# Optional: enable this to show divider lines between segments
show_divider: false
color_preset: preset_1
# Optional: only set this when overriding the preset-driven track blend
track_blend: 0.15
# Optional: enable this to fade neighboring segment colors into each other
fade_between_segments: false
entities:
  pv_primary: sensor.solar_production_daily
  pv_secondary_1: ""
  pv_secondary_2: ""
  grid_import_primary: sensor.grid_import_daily
  grid_import_secondary_1: ""
  grid_import_secondary_2: ""
  battery_output_primary: sensor.battery_output_daily
  battery_output_secondary_1: sensor.battery_output_detail_1
  battery_output_secondary_2: ""
  grid_export_primary: sensor.grid_export_daily
  grid_export_secondary_1: sensor.grid_export_detail_1
  grid_export_secondary_2: ""
# Optional: add this block only when using manual color overrides
colors:
  background: "#000000"
  track: "#EAECEF"
  text_light: "#F4F7FA"
  text_dark: "#2E2E2E"
  divider: "#dbdde0"
  energy_source: "#E6C86E"
  energy_storage_supply: "#5B9BCF"
  grid_import: "#C99A6A"
  grid_export: "#8C6BB3"
```

## Options

| Option                         | Default                                 | Notes                                                 |
| ------------------------------ | --------------------------------------- | ----------------------------------------------------- |
| `type`                         | required                                | Must be `custom:house-energy-bar`                     |
| `bar_height`                   | `56`                                    | Clamp range `24..72`                                  |
| `corner_radius`                | `28`                                    | Clamp range `0..30`                                   |
| `show_solar_segment`           | `false`                                 | Adds an optional PV segment as the first segment     |
| `background_transparent`       | `true`                                  | Hides full card background when enabled (track remains visible) |
| `show_divider`                 | `false`                                 | Shows divider lines between sections                  |
| `color_preset`                 | `preset_1`                              | Global semantic preset baseline shared across all three cards |
| `track_blend`                  | preset-dependent                        | Range `0.10..0.40`; optional manual override for track/color mixing |
| `fade_between_segments`        | `false`                                 | If `true`, sections fade into neighboring colors; default is solid section boundaries |
| `colors.background`            | `#000000`                               | Full card background color                            |
| `colors.track`                 | `#EAECEF`                               | Track color behind segment values                     |
| `colors.text_light`            | `#F4F7FA`                               | Light text/icon color used when it gives better contrast |
| `colors.text_dark`             | preset-dependent                        | Dark text/icon color used when it gives better contrast |
| `colors.divider`               | preset-dependent                        | Divider color between visible segments                |
| `colors.energy_source`         | preset-dependent                        | Shared semantic token for PV production               |
| `colors.energy_storage_supply` | preset-dependent                        | Shared semantic token for battery output              |
| `colors.grid_import`           | preset-dependent                        | Shared semantic token for grid import                 |
| `colors.grid_export`           | preset-dependent                        | Shared semantic token for grid export                 |
| `entities.pv_primary`          | `""`                                    | PV top row entity (used when `show_solar_segment` is `true`) |
| `entities.pv_secondary_1`      | `""`                                    | PV second row entity 1 (optional)                     |
| `entities.pv_secondary_2`      | `""`                                    | PV second row entity 2 (optional)                     |
| `entities.grid_import_primary` | required                                | Grid import top row entity (required)                 |
| `entities.grid_import_secondary_1` | `""`                               | Grid import second row entity 1 (optional)            |
| `entities.grid_import_secondary_2` | `""`                               | Grid import second row entity 2 (optional)            |
| `entities.battery_output_primary` | required                           | Battery output top row entity (required)              |
| `entities.battery_output_secondary_1` | `""`                            | Battery output second row entity 1 (optional)         |
| `entities.battery_output_secondary_2` | `""`                            | Battery output second row entity 2 (optional)         |
| `entities.grid_export_primary` | required                                | Grid export top row entity (required)                 |
| `entities.grid_export_secondary_1` | `""`                               | Grid export second row entity 1 (optional)            |
| `entities.grid_export_secondary_2` | `""`                               | Grid export second row entity 2 (optional)            |

Color resolution priority for preset-controlled colors: selected `color_preset` < manual `colors.*` overrides.

Legacy `colors.text` is still accepted and is migrated to both `colors.text_light` and `colors.text_dark`.

`colors.background` stays separate from presets and controls only the outer card background. In the visual editor it is only written to YAML when you explicitly set a non-default background override.

In the visual editor, `show_solar_segment` lives at the top of `Entities`, and the PV segment color is controlled by `colors.energy_source` in the same preset/override flow as the other cards. The House Energy YAML keys use semantic names: `entities.pv_*`, `entities.grid_import_*`, `entities.battery_output_*`, and `entities.grid_export_*`. `fade_between_segments` is always available in `Colors`, while `Use custom color overrides` turns manual semantic colors and `track_blend` on or off. Background stays independent in `Layout & Motion`, so changing the card background does not activate manual color overrides or block presets.

Preset styles: `preset_1` Classic, `preset_2` Industrial, `preset_3` Coffee, `preset_4` Ocean, `preset_5` Forest.

Visible metric icons always come from the configured Home Assistant entities.

The card and visual editor no longer prefill entity ids.

## Development

Run commands from `house_energy_bar/`:

```bash
npm run build
npm run check:syntax
```
