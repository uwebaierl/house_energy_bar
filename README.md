# House Energy Bar

<img style="max-width: 1000px; width: 100%; height: auto;" alt="House Energy Bar Overview" src="https://raw.githubusercontent.com/uwebaierl/house_energy_bar/main/docs/images/house_energy_bar_01.png" />

House Energy Bar is a compact Home Assistant Lovelace card with 3 fixed generic segments.

## Features

- Fixed 3-segment generic layout
- Each segment supports 1 required primary metric and 2 optional secondary metrics
- Secondary metrics are hidden when entity ids are empty or omitted
- Nested YAML configuration with `entities`, `decimals`, and `colors`
- Built-in visual editor for all supported options
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

## Full Example

```yaml
type: custom:house-energy-bar
bar_height: 56
corner_radius: 28
track_blend: 0.15
background_transparent: true
show_divider: false
entities:
  segment1_primary: sensor.segment1_primary
  segment1_secondary_1: ""
  segment1_secondary_2: ""
  segment2_primary: sensor.segment2_primary
  segment2_secondary_1: sensor.segment2_secondary_1
  segment2_secondary_2: ""
  segment3_primary: sensor.segment3_primary
  segment3_secondary_1: sensor.segment3_secondary_1
  segment3_secondary_2: ""
decimals:
  primary: 2
  secondary: 2
colors:
  background: "#000000"
  track: "#EAECEF"
  segment1: "#C99A6A"
  segment2: "#5B9BCF"
  segment3: "#8C6BB3"
  text: "#2E2E2E"
  divider: "#dbdde0"
```

## Options

| Option                         | Default                                 | Notes                                                 |
| ------------------------------ | --------------------------------------- | ----------------------------------------------------- |
| `type`                         | required                                | Must be `custom:house-energy-bar`                     |
| `bar_height`                   | `56`                                    | Clamp range `24..72`                                  |
| `corner_radius`                | `28`                                    | Clamp range `0..30`                                   |
| `track_blend`                  | `0.15`                                  | Clamp range `0.15..0.3` for segment/track blending    |
| `background_transparent`       | `true`                                  | Hides full card background when enabled (track remains visible) |
| `show_divider`                 | `false`                                 | Shows divider lines between sections                  |
| `colors.background`            | `#000000`                               | Full card background color                            |
| `colors.track`                 | `#EAECEF`                               | Track color behind segment values                     |
| `colors.segment1`              | `#C99A6A`                               | Segment 1 color before track blending                 |
| `colors.segment2`              | `#5B9BCF`                               | Segment 2 color before track blending                 |
| `colors.segment3`              | `#8C6BB3`                               | Segment 3 color before track blending                 |
| `colors.text`                  | `#2E2E2E`                               | Text and icon color                                   |
| `colors.divider`               | `#dbdde0`                               | Divider color between Segment 1/2/3                   |
| `entities.segment1_primary`    | `sensor.segment1_primary`              | Segment 1 primary (required)                          |
| `entities.segment1_secondary_1`| `""`                                   | Segment 1 secondary 1 (optional)                      |
| `entities.segment1_secondary_2`| `""`                                   | Segment 1 secondary 2 (optional)                      |
| `entities.segment2_primary`    | `sensor.segment2_primary`              | Segment 2 primary (required)                          |
| `entities.segment2_secondary_1`| `""`                                   | Segment 2 secondary 1 (optional)                      |
| `entities.segment2_secondary_2`| `""`                                   | Segment 2 secondary 2 (optional)                      |
| `entities.segment3_primary`    | `sensor.segment3_primary`              | Segment 3 primary (required)                          |
| `entities.segment3_secondary_1`| `""`                                   | Segment 3 secondary 1 (optional)                      |
| `entities.segment3_secondary_2`| `""`                                   | Segment 3 secondary 2 (optional)                      |
| `decimals.primary`             | `2`                                     | Clamp range `0..2` for all primary metrics            |
| `decimals.secondary`           | `2`                                     | Clamp range `0..2` for all secondary metrics          |

## Development

Run commands from `house_energy_bar/`:

```bash
npm run build
npm run check:syntax
```
