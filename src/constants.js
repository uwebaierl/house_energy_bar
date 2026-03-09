export const CARD_ELEMENT_TAG = "house-energy-bar";
export const CARD_TYPE = "custom:house-energy-bar";
export const CARD_NAME = "House Energy Bar";
export const SEGMENT_IDS = ["segment1", "segment2", "segment3"];
export const SEGMENT_ENTITY_MAP = {
  segment1: {
    primary: "segment1_primary",
    secondaries: ["segment1_secondary_1", "segment1_secondary_2"],
  },
  segment2: {
    primary: "segment2_primary",
    secondaries: ["segment2_secondary_1", "segment2_secondary_2"],
  },
  segment3: {
    primary: "segment3_primary",
    secondaries: ["segment3_secondary_1", "segment3_secondary_2"],
  },
};

export const DEFAULT_CONFIG = {
  type: CARD_TYPE,
  bar_height: 56,
  corner_radius: 28,
  track_blend: 0.15,
  background_transparent: true,
  show_divider: false,
  entities: {
    segment1_primary: "sensor.segment1_primary",
    segment1_secondary_1: "",
    segment1_secondary_2: "",
    segment2_primary: "sensor.segment2_primary",
    segment2_secondary_1: "",
    segment2_secondary_2: "",
    segment3_primary: "sensor.segment3_primary",
    segment3_secondary_1: "",
    segment3_secondary_2: "",
  },
  decimals: {
    primary: 2,
    secondary: 2,
  },
  colors: {
    background: "#000000",
    track: "#EAECEF",
    segment1: "#C99A6A",
    segment2: "#5B9BCF",
    segment3: "#8C6BB3",
    text: "#2E2E2E",
    divider: "#dbdde0",
  },
};

export const REQUIRED_ENTITY_KEYS = SEGMENT_IDS.map((segmentId) => SEGMENT_ENTITY_MAP[segmentId].primary);
export const OPTIONAL_ENTITY_KEYS = SEGMENT_IDS.flatMap((segmentId) => SEGMENT_ENTITY_MAP[segmentId].secondaries);
export const ENTITY_KEYS = SEGMENT_IDS.flatMap((segmentId) => [
  SEGMENT_ENTITY_MAP[segmentId].primary,
  ...SEGMENT_ENTITY_MAP[segmentId].secondaries,
]);

export const DECIMAL_KEYS = ["primary", "secondary"];
export const COLOR_KEYS = ["background", "track", "segment1", "segment2", "segment3", "text", "divider"];
