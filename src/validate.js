import {
  CARD_TYPE,
  COLOR_KEYS,
  DEFAULT_CONFIG,
  OPTIONAL_ENTITY_KEYS,
  REQUIRED_ENTITY_KEYS,
} from "./constants.js";
import {
  isKnownColorPreset,
  mergeColorPresetTokens,
  resolveColorPresetTrackBlend,
} from "./_shared/color-presets.js";
import {
  normalizeEntity,
  normalizeMappedStringValues,
  normalizeObjectInput,
  normalizeOptionalEntity,
  normalizeString,
  validateBoolean,
  validateCardType,
  validateColorPresetValue,
  validateConfigObject,
  validateOptionalEntityMap,
  validateRange,
  validateRequiredColorMap,
  validateRequiredEntityMap,
} from "./_shared/validation.js";

const HOUSE_COLOR_OVERRIDE_MAP = {
  track: ["track"],
  text_light: ["text_light", "text"],
  text_dark: ["text_dark", "text"],
  divider: ["divider"],
  energy_source: ["energy_source"],
  energy_storage_supply: ["energy_storage_supply", "segment2"],
  grid_import: ["grid_import", "segment1"],
  grid_export: ["grid_export", "segment3"],
};

export function validateConfig(config) {
  validateConfigObject(config);
  validateCardType(config, CARD_TYPE);

  validateRange(config.bar_height, "bar_height", 24, 72);
  validateRange(config.corner_radius, "corner_radius", 0, 30);
  validateRange(config.track_blend, "track_blend", 0.1, 0.4);
  validateColorPresetValue(config.color_preset, isKnownColorPreset);
  validateBoolean(config.fade_between_segments, "fade_between_segments");
  validateBoolean(config.show_solar_segment, "show_solar_segment");
  validateBoolean(config.background_transparent, "background_transparent");
  validateBoolean(config.show_divider, "show_divider");
  validateRequiredEntityMap(config.entities, REQUIRED_ENTITY_KEYS);
  validateOptionalEntityMap(config.entities, OPTIONAL_ENTITY_KEYS);
  validateRequiredColorMap(config.colors, COLOR_KEYS);
}

export function normalizeConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const entitiesInput = normalizeObjectInput(source.entities);
  const colorsInput = normalizeObjectInput(source.colors);

  return {
    type: CARD_TYPE,
    color_preset: source.color_preset === undefined ? DEFAULT_CONFIG.color_preset : source.color_preset,
    bar_height: source.bar_height === undefined ? DEFAULT_CONFIG.bar_height : Number(source.bar_height),
    corner_radius: source.corner_radius === undefined ? DEFAULT_CONFIG.corner_radius : Number(source.corner_radius),
    track_blend: source.track_blend === undefined
      ? resolveColorPresetTrackBlend(source.color_preset, DEFAULT_CONFIG.track_blend)
      : Number(source.track_blend),
    fade_between_segments: source.fade_between_segments === undefined
      ? DEFAULT_CONFIG.fade_between_segments
      : source.fade_between_segments,
    show_solar_segment: source.show_solar_segment === undefined
      ? DEFAULT_CONFIG.show_solar_segment
      : source.show_solar_segment,
    background_transparent: source.background_transparent === undefined
      ? DEFAULT_CONFIG.background_transparent
      : source.background_transparent,
    show_divider: source.show_divider === undefined
      ? DEFAULT_CONFIG.show_divider
      : source.show_divider,
    entities: normalizeEntities(entitiesInput),
    colors: {
      background: normalizeString(colorsInput.background, DEFAULT_CONFIG.colors.background),
      ...mergeColorPresetTokens(
        source.color_preset,
        {},
        normalizeMappedStringValues(colorsInput, HOUSE_COLOR_OVERRIDE_MAP, null),
      ),
    },
  };
}

function normalizeEntities(entitiesInput) {
  const entities = {};

  for (const key of REQUIRED_ENTITY_KEYS) {
    entities[key] = normalizeEntity(entitiesInput[key]);
  }

  for (const key of OPTIONAL_ENTITY_KEYS) {
    entities[key] = normalizeOptionalEntity(entitiesInput[key]);
  }

  return entities;
}
