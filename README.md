# House Energy Bar

House Energy Bar is a compact Home Assistant Lovelace card with 3 fixed generic segments.

## Features

- Fixed 3-segment generic layout
- Each segment supports 1 required primary metric and 2 optional secondary metrics
- Secondary metrics are hidden when entity ids are empty or omitted
- Nested YAML configuration with `entities`, `decimals`, and `colors`
- Built-in visual editor for all supported options
- Adjustable height and corner radius to match [Bubble Card](https://github.com/Clooos/Bubble-Card) layouts cleanly

## Installation

### HACS

After installing, confirm this Lovelace resource exists:

```yaml
url: /hacsfiles/house_energy_bar/house_energy_bar.js
type: module
```

### Manual

1. Copy `dist/house_energy_bar.js` to `www/community/house_energy_bar/`.
2. Add this Lovelace resource:

```yaml
url: /local/community/house_energy_bar/house_energy_bar.js
type: module
```

If you see `Custom element not found: house-energy-bar`, hard-refresh the browser and verify the resource URL matches exactly.

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
