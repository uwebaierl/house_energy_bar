import {
  DEFAULT_BAR_HEIGHT_PX,
  DEFAULT_RADIUS_PX,
} from "./_shared/layout-tokens.js";

export const CARD_ELEMENT_TAG = "house-energy-bar";
export const CARD_TYPE = "custom:house-energy-bar";
export const CARD_NAME = "House Energy Bar";
export const PV_SEGMENT_ID = "pv";
export const CORE_SEGMENT_IDS = ["grid_import", "battery_output", "grid_export"];
export const SEGMENT_IDS = [PV_SEGMENT_ID, ...CORE_SEGMENT_IDS];
export const SEGMENT_LABELS = {
  pv: "Solar production",
  grid_import: "Grid import",
  battery_output: "Battery output",
  grid_export: "Grid export",
};
export const SEGMENT_COLOR_TOKENS = {
  pv: "energy_source",
  grid_import: "grid_import",
  battery_output: "energy_storage_supply",
  grid_export: "grid_export",
};
export const SEGMENT_ENTITY_MAP = {
  pv: {
    primary: "pv_primary",
    secondaries: ["pv_secondary_1", "pv_secondary_2"],
  },
  grid_import: {
    primary: "grid_import_primary",
    secondaries: ["grid_import_secondary_1", "grid_import_secondary_2"],
  },
  battery_output: {
    primary: "battery_output_primary",
    secondaries: ["battery_output_secondary_1", "battery_output_secondary_2"],
  },
  grid_export: {
    primary: "grid_export_primary",
    secondaries: ["grid_export_secondary_1", "grid_export_secondary_2"],
  },
};

export const DEFAULT_CONFIG = {
  type: CARD_TYPE,
  color_preset: "preset_1",
  bar_height: DEFAULT_BAR_HEIGHT_PX,
  corner_radius: DEFAULT_RADIUS_PX,
  track_blend: 0.15,
  fade_between_segments: false,
  show_solar_segment: false,
  background_transparent: true,
  show_divider: false,
  entities: {
    pv_primary: "",
    pv_secondary_1: "",
    pv_secondary_2: "",
    grid_import_primary: "",
    grid_import_secondary_1: "",
    grid_import_secondary_2: "",
    battery_output_primary: "",
    battery_output_secondary_1: "",
    battery_output_secondary_2: "",
    grid_export_primary: "",
    grid_export_secondary_1: "",
    grid_export_secondary_2: "",
  },
  colors: {
    background: "#000000",
  },
};

export const REQUIRED_ENTITY_KEYS = CORE_SEGMENT_IDS.map((segmentId) => SEGMENT_ENTITY_MAP[segmentId].primary);
export const OPTIONAL_ENTITY_KEYS = [
  SEGMENT_ENTITY_MAP.pv.primary,
  ...SEGMENT_ENTITY_MAP.pv.secondaries,
  ...CORE_SEGMENT_IDS.flatMap((segmentId) => SEGMENT_ENTITY_MAP[segmentId].secondaries),
];
export const ENTITY_KEYS = SEGMENT_IDS.flatMap((segmentId) => [
  SEGMENT_ENTITY_MAP[segmentId].primary,
  ...SEGMENT_ENTITY_MAP[segmentId].secondaries,
]);
export const COLOR_KEYS = [
  "background",
  "track",
  "text_light",
  "text_dark",
  "divider",
  "energy_source",
  "energy_storage_supply",
  "grid_import",
  "grid_export",
];
