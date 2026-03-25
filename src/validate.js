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
  normalizeColorPresetName,
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
    color_preset: normalizeColorPresetName(source.color_preset),
    bar_height: clampNumber(source.bar_height, 24, 72, DEFAULT_CONFIG.bar_height),
    corner_radius: clampNumber(source.corner_radius, 0, 30, DEFAULT_CONFIG.corner_radius),
    track_blend: clampNumber(
      source.track_blend,
      0.1,
      0.4,
      resolveColorPresetTrackBlend(source.color_preset, DEFAULT_CONFIG.track_blend),
    ),
    fade_between_segments: typeof source.fade_between_segments === "boolean"
      ? source.fade_between_segments
      : DEFAULT_CONFIG.fade_between_segments,
    show_solar_segment: typeof source.show_solar_segment === "boolean"
      ? source.show_solar_segment
      : DEFAULT_CONFIG.show_solar_segment,
    background_transparent: typeof source.background_transparent === "boolean"
      ? source.background_transparent
      : DEFAULT_CONFIG.background_transparent,
    show_divider: typeof source.show_divider === "boolean"
      ? source.show_divider
      : DEFAULT_CONFIG.show_divider,
    entities: normalizeEntities(entitiesInput),
    colors: mergeColorPresetTokens(
      source.color_preset,
      DEFAULT_CONFIG.colors,
      normalizeColorOverrides(colorsInput),
    ),
  };
}

function validateRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function normalizeRequiredEntity(value, fallback) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function normalizeOptionalEntity(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== "string") {
    return fallback;
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
    entities[key] = normalizeRequiredEntity(entitiesInput[key], DEFAULT_CONFIG.entities[key]);
  }

  for (const key of OPTIONAL_ENTITY_KEYS) {
    entities[key] = normalizeOptionalEntity(entitiesInput[key], DEFAULT_CONFIG.entities[key]);
  }

  return entities;
}

function validateColorPreset(value) {
  if (value === undefined) {
    return;
  }
  if (!isKnownColorPreset(value)) {
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
