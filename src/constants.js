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
  bar_height: 56,
  corner_radius: 28,
  track_blend: 0.15,
  fade_between_segments: false,
  show_solar_segment: false,
  background_transparent: true,
  show_divider: false,
  entities: {
    pv_primary: "sensor.solar_production_daily",
    pv_secondary_1: "",
    pv_secondary_2: "",
    grid_import_primary: "sensor.grid_import_daily",
    grid_import_secondary_1: "",
    grid_import_secondary_2: "",
    battery_output_primary: "sensor.battery_output_daily",
    battery_output_secondary_1: "",
    battery_output_secondary_2: "",
    grid_export_primary: "sensor.grid_export_daily",
    grid_export_secondary_1: "",
    grid_export_secondary_2: "",
  },
  colors: {
    background: "#000000",
    track: "#EAECEF",
    text_light: "#F4F7FA",
    text_dark: "#2E2E2E",
    divider: "#dbdde0",
    energy_source: "#E6C86E",
    energy_storage_supply: "#5B9BCF",
    grid_import: "#C99A6A",
    grid_export: "#8C6BB3",
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
