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

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid configuration.");
  }

  if (config.type !== CARD_TYPE) {
    throw new Error(`Card type must be '${CARD_TYPE}'.`);
  }

  validateRange(config.bar_height, "bar_height", 24, 72);
  validateRange(config.corner_radius, "corner_radius", 0, 30);
  validateRange(config.track_blend, "track_blend", 0.1, 0.4);
  validateColorPreset(config.color_preset);
  if (typeof config.fade_between_segments !== "boolean") {
    throw new Error("fade_between_segments must be true or false.");
  }
  if (typeof config.show_solar_segment !== "boolean") {
    throw new Error("show_solar_segment must be true or false.");
  }
  if (typeof config.background_transparent !== "boolean") {
    throw new Error("background_transparent must be true or false.");
  }
  if (typeof config.show_divider !== "boolean") {
    throw new Error("show_divider must be true or false.");
  }

  if (!config.entities || typeof config.entities !== "object") {
    throw new Error("entities must be an object.");
  }

  for (const key of REQUIRED_ENTITY_KEYS) {
    const value = config.entities[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`entities.${key} must be a non-empty entity id string.`);
    }
  }

  for (const key of OPTIONAL_ENTITY_KEYS) {
    const value = config.entities[key];
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new Error(`entities.${key} must be an entity id string when set.`);
    }
  }

  if (!config.colors || typeof config.colors !== "object") {
    throw new Error("colors must be an object.");
  }
  for (const key of COLOR_KEYS) {
    const value = config.colors[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`colors.${key} must be a non-empty color string.`);
    }
  }

}

export function normalizeConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const entitiesInput = source.entities && typeof source.entities === "object" ? source.entities : {};
  const colorsInput = source.colors && typeof source.colors === "object" ? source.colors : {};

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
      background: normalizeColor(colorsInput.background, DEFAULT_CONFIG.colors.background),
      ...mergeColorPresetTokens(
        source.color_preset,
        {},
        normalizeColorOverrides(colorsInput),
      ),
    },
  };
}

function validateRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

function normalizeRequiredEntity(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeOptionalEntity(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
}

function normalizeColor(value, fallback) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function normalizeEntities(entitiesInput) {
  const entities = {};

  for (const key of REQUIRED_ENTITY_KEYS) {
    entities[key] = normalizeRequiredEntity(entitiesInput[key]);
  }

  for (const key of OPTIONAL_ENTITY_KEYS) {
    entities[key] = normalizeOptionalEntity(entitiesInput[key]);
  }

  return entities;
}

function validateColorPreset(value) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string" || !isKnownColorPreset(value)) {
    throw new Error("color_preset must be a supported preset name.");
  }
}

function normalizeColorOverrides(colorsInput) {
  return {
    background: normalizeColor(colorsInput.background, null),
    track: normalizeColor(colorsInput.track, null),
    text_light: normalizeColor(colorsInput.text_light ?? colorsInput.text, null),
    text_dark: normalizeColor(colorsInput.text_dark ?? colorsInput.text, null),
    divider: normalizeColor(colorsInput.divider, null),
    energy_source: normalizeColor(colorsInput.energy_source, null),
    energy_storage_supply: normalizeColor(
      colorsInput.energy_storage_supply ?? colorsInput.segment2,
      null,
    ),
    grid_import: normalizeColor(
      colorsInput.grid_import ?? colorsInput.segment1,
      null,
    ),
    grid_export: normalizeColor(
      colorsInput.grid_export ?? colorsInput.segment3,
      null,
    ),
  };
}
