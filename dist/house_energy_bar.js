/* House Energy Bar - generated file. Do not edit directly. */
/* src/_shared/availability.js */
const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);

function isUnavailableState(raw) {
  return UNAVAILABLE_STATES.has(`${raw ?? ""}`.trim().toLowerCase());
}

function resolveEntityStatus(entityId, stateObj) {
  if (!entityId) {
    return "omitted";
  }
  if (!stateObj) {
    return "missing";
  }

  const rawState = `${stateObj.state ?? ""}`.trim();
  return isUnavailableState(rawState) ? "unavailable" : "ready";
}

/* src/_shared/entity-format.js */
function formatEntityStateValue(hass, stateObj, overrideState) {
  if (!stateObj) {
    return "—";
  }

  const raw = overrideState ?? stateObj.state;
  if (isUnavailableState(raw)) {
    return "—";
  }

  if (typeof hass?.formatEntityState === "function") {
    try {
      return hass.formatEntityState(stateObj, String(raw));
    } catch (_error) {
      // Fall back to a basic raw-state formatter for older HA versions.
    }
  }

  return fallbackFormatEntityState(stateObj, raw);
}

function fallbackFormatEntityState(stateObj, raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    return "—";
  }

  const unit = `${stateObj.attributes?.unit_of_measurement ?? ""}`.trim();
  return unit ? `${text} ${unit}` : text;
}

/* src/constants.js */
const CARD_ELEMENT_TAG = "house-energy-bar";
const CARD_TYPE = "custom:house-energy-bar";
const CARD_NAME = "House Energy Bar";
const PV_SEGMENT_ID = "pv";
const CORE_SEGMENT_IDS = ["grid_import", "battery_output", "grid_export"];
const SEGMENT_IDS = [PV_SEGMENT_ID, ...CORE_SEGMENT_IDS];
const SEGMENT_LABELS = {
  pv: "Solar production",
  grid_import: "Grid import",
  battery_output: "Battery output",
  grid_export: "Grid export",
};
const SEGMENT_COLOR_TOKENS = {
  pv: "energy_source",
  grid_import: "grid_import",
  battery_output: "energy_storage_supply",
  grid_export: "grid_export",
};
const SEGMENT_ENTITY_MAP = {
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

const DEFAULT_CONFIG = {
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

const REQUIRED_ENTITY_KEYS = CORE_SEGMENT_IDS.map((segmentId) => SEGMENT_ENTITY_MAP[segmentId].primary);
const OPTIONAL_ENTITY_KEYS = [
  SEGMENT_ENTITY_MAP.pv.primary,
  ...SEGMENT_ENTITY_MAP.pv.secondaries,
  ...CORE_SEGMENT_IDS.flatMap((segmentId) => SEGMENT_ENTITY_MAP[segmentId].secondaries),
];
const ENTITY_KEYS = SEGMENT_IDS.flatMap((segmentId) => [
  SEGMENT_ENTITY_MAP[segmentId].primary,
  ...SEGMENT_ENTITY_MAP[segmentId].secondaries,
]);
const COLOR_KEYS = [
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

/* src/house-energy-model.js */
const DEFAULT_METRIC_ICONS = {
  secondary: "mdi:information-outline",
  [SEGMENT_ENTITY_MAP[PV_SEGMENT_ID].primary]: "mdi:white-balance-sunny",
  [SEGMENT_ENTITY_MAP.grid_import.primary]: "mdi:transmission-tower-import",
  [SEGMENT_ENTITY_MAP.battery_output.primary]: "mdi:power-socket-de",
  [SEGMENT_ENTITY_MAP.grid_export.primary]: "mdi:transmission-tower-export",
};

function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  return ENTITY_KEYS
    .map((key) => entities[key])
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

function buildCardModel(config, hass) {
  const entities = config?.entities || {};
  const model = {};

  SEGMENT_IDS.forEach((segmentId, index) => {
    const segmentDef = SEGMENT_ENTITY_MAP[segmentId];
    const fallbackLabel = SEGMENT_LABELS[segmentId] || `Segment ${index + 1}`;
    model[segmentId] = {
      primary: buildMetricView(
        hass,
        entities[segmentDef.primary],
        segmentDef.primary,
        fallbackLabel,
      ),
      chips: segmentDef.secondaries.map((secondaryKey, chipIndex) => buildMetricView(
        hass,
        entities[secondaryKey],
        "secondary",
        `${fallbackLabel} detail ${chipIndex + 1}`,
      )),
    };
  });

  return model;
}

function buildMetricView(hass, entityId, kind, fallbackLabel) {
  const stateObj = entityId ? hass?.states?.[entityId] : null;
  const status = resolveEntityStatus(entityId, stateObj);
  const friendlyName = stateObj?.attributes?.friendly_name || fallbackLabel;
  const value = formatMetricValue(hass, stateObj);

  return {
    entityId: status === "ready" ? entityId || "" : "",
    icon: resolveMetricIcon(stateObj, kind),
    value,
    title: buildMetricTitle(friendlyName, fallbackLabel, value, status),
    available: status === "ready",
    configured: status !== "omitted",
    status,
  };
}

function buildMetricTitle(friendlyName, fallbackLabel, value, status) {
  if (status === "ready") {
    return `${friendlyName}: ${value}`;
  }
  if (status === "omitted") {
    return fallbackLabel;
  }
  return `${friendlyName}: unavailable`;
}

function resolveMetricIcon(stateObj, kind) {
  const explicitIcon = `${stateObj?.attributes?.icon ?? ""}`.trim();
  if (explicitIcon) {
    return explicitIcon;
  }
  return DEFAULT_METRIC_ICONS[kind] || "";
}

function formatMetricValue(hass, stateObj) {
  return formatEntityStateValue(hass, stateObj);
}

/* src/_shared/config-cleanup.js */
function createRemovePathsCleanup(paths) {
  const normalizedPaths = Array.isArray(paths) ? paths : [];
  return (config) => removeConfigPaths(config, normalizedPaths);
}

function runConfigCleanup(config, steps) {
  const source = isObject(config) ? cloneConfig(config) : {};
  let next = source;

  for (const step of Array.isArray(steps) ? steps : []) {
    if (typeof step !== "function") {
      continue;
    }
    const candidate = step(next);
    if (isObject(candidate)) {
      next = candidate;
    }
  }

  return {
    config: next,
    changed: computeConfigCleanupKey(source) !== computeConfigCleanupKey(next),
  };
}

function queueConfigCleanup(host, config, state) {
  if (!host || !isObject(config) || !isObject(state)) {
    return;
  }

  const cleanupKey = computeConfigCleanupKey(config);
  if (!cleanupKey || state.pendingKey === cleanupKey || state.lastAppliedKey === cleanupKey) {
    return;
  }

  state.pendingKey = cleanupKey;
  state.pendingConfig = config;
  flushConfigCleanup(host, state);
}

function emitConfigChanged(host, config) {
  if (!host || !isObject(config)) {
    return;
  }

  host.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config },
    bubbles: true,
    composed: true,
  }));
}

function computeConfigCleanupKey(config) {
  if (!isObject(config)) {
    return "";
  }
  return JSON.stringify(config);
}

function flushConfigCleanup(host, state) {
  if (!host || !isObject(state) || !state.pendingKey || !isObject(state.pendingConfig) || !host.isConnected) {
    return;
  }

  const cleanupKey = state.pendingKey;
  queueMicrotask(() => {
    if (!host.isConnected || state.pendingKey !== cleanupKey || !isObject(state.pendingConfig)) {
      return;
    }

    const config = state.pendingConfig;
    state.pendingKey = "";
    state.pendingConfig = null;
    state.lastAppliedKey = cleanupKey;
    emitConfigChanged(host, config);
  });
}

function removeConfigPaths(config, paths) {
  let next = config;

  for (const path of paths) {
    const segments = normalizePath(path);
    if (segments.length === 0) {
      continue;
    }
    next = removeConfigPath(next, segments);
  }

  return next;
}

function removeConfigPath(config, segments) {
  if (!isObject(config) || segments.length === 0) {
    return config;
  }

  const [segment, ...rest] = segments;
  if (!(segment in config)) {
    return config;
  }

  if (rest.length === 0) {
    const next = { ...config };
    delete next[segment];
    return next;
  }

  const child = config[segment];
  if (!isObject(child)) {
    return config;
  }

  const nextChild = removeConfigPath(child, rest);
  if (nextChild === child) {
    return config;
  }

  return {
    ...config,
    [segment]: nextChild,
  };
}

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path.filter((segment) => typeof segment === "string" && segment.length > 0);
  }
  if (typeof path !== "string" || path.trim().length === 0) {
    return [];
  }
  return path.split(".").map((segment) => segment.trim()).filter(Boolean);
}

function cloneConfig(config) {
  if (typeof structuredClone === "function") {
    return structuredClone(config);
  }
  return JSON.parse(JSON.stringify(config));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* src/_shared/math.js */
function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

/* src/_shared/color.js */
function buildSmoothSegmentGradient(centerColor, prevColor, nextColor) {
  const leftBoundary = prevColor ? mixHex(prevColor, centerColor, 0.5) : centerColor;
  const rightBoundary = nextColor ? mixHex(centerColor, nextColor, 0.5) : centerColor;
  return `linear-gradient(90deg, ${leftBoundary} 0%, ${centerColor} 30%, ${centerColor} 70%, ${rightBoundary} 100%)`;
}

function buildSegmentBackground(centerColor, prevColor, nextColor, fadeBetweenSegments = true) {
  if (fadeBetweenSegments === false) {
    return centerColor;
  }
  return buildSmoothSegmentGradient(centerColor, prevColor, nextColor);
}

function blendHex(baseHex, accentHex, blendAmount) {
  const base = parseHex(baseHex);
  const accent = parseHex(accentHex);
  const blend = clamp(0, Number(blendAmount) || 0, 1);
  const keep = 1 - blend;

  return toHex({
    r: Math.round((base.r * blend) + (accent.r * keep)),
    g: Math.round((base.g * blend) + (accent.g * keep)),
    b: Math.round((base.b * blend) + (accent.b * keep)),
  });
}

function mixHex(aHex, bHex, ratio) {
  const a = parseHex(aHex);
  const b = parseHex(bHex);
  const t = clamp(0, Number(ratio) || 0, 1);
  return toHex({
    r: (a.r * (1 - t)) + (b.r * t),
    g: (a.g * (1 - t)) + (b.g * t),
    b: (a.b * (1 - t)) + (b.b * t),
  });
}

function normalizeHexColor(value, fallback) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }
  return String(fallback || "#000000").toUpperCase();
}

function pickBestTextColor(backgroundHex, lightTextHex, darkTextHex) {
  const background = normalizeHexColor(backgroundHex, "#000000");
  const light = normalizeHexColor(lightTextHex, "#FFFFFF");
  const dark = normalizeHexColor(darkTextHex, "#000000");

  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark;
}

function parseHex(hex) {
  const cleaned = String(hex || "").trim();
  const value = /^#[0-9A-Fa-f]{6}$/.test(cleaned) ? cleaned.slice(1) : "000000";
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function toHex(rgb) {
  const r = clamp(0, Math.round(rgb.r), 255).toString(16).padStart(2, "0");
  const g = clamp(0, Math.round(rgb.g), 255).toString(16).padStart(2, "0");
  const b = clamp(0, Math.round(rgb.b), 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function contrastRatio(aHex, bHex) {
  const a = relativeLuminance(aHex);
  const b = relativeLuminance(bHex);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const rgb = parseHex(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

/* src/_shared/color-presets.js */
const COLOR_TOKEN_KEYS = [
  "track",
  "text_light",
  "text_dark",
  "divider",
  "energy_source",
  "energy_storage_in",
  "energy_storage_out",
  "energy_storage_supply",
  "home_load",
  "grid_import",
  "grid_export",
];

const PRESET_OPTIONS = [
  { value: "preset_1", label: "Classic" },
  { value: "preset_2", label: "Industrial" },
  { value: "preset_3", label: "Coffee" },
  { value: "preset_4", label: "Ocean" },
  { value: "preset_5", label: "Forest" },
];

const COLOR_PRESETS = {
  preset_1: {
    track: "#EAECEF",
    text_light: "#F4F7FA",
    text_dark: "#2E2E2E",
    divider: "#DBDDE0",
    energy_source: "#E6C86E",
    energy_storage_in: "#4CAF8E",
    energy_storage_out: "#2E8B75",
    energy_storage_supply: "#5B9BCF",
    home_load: "#9FA8B2",
    grid_import: "#C99A6A",
    grid_export: "#8C6BB3",
    track_blend: 0.15,
  },
  preset_2: {
    track: "#888888",
    text_light: "#F5F5F5",
    text_dark: "#2A2A2A",
    divider: "#BBBBBB",
    energy_source: "#EEEEEE",
    energy_storage_in: "#DDDDDD",
    energy_storage_out: "#CCCCCC",
    energy_storage_supply: "#E4E4E4",
    home_load: "#BBBBBB",
    grid_import: "#AAAAAA",
    grid_export: "#F4F4F4",
    track_blend: 0.20,
  },
  preset_3: {
    track: "#8B5A34",
    text_light: "#FDF4EC",
    text_dark: "#2E1A08",
    divider: "#D0A77C",
    energy_source: "#F8E8D8",
    energy_storage_in: "#F0DAC5",
    energy_storage_out: "#E8CBAE",
    energy_storage_supply: "#F4E2CE",
    home_load: "#E2BC95",
    grid_import: "#D0A77C",
    grid_export: "#FDF6F0",
    track_blend: 0.22,
  },
  preset_4: {
    track: "#2E6A8A",
    text_light: "#EDF7FF",
    text_dark: "#0D2E3F",
    divider: "#6DA9C7",
    energy_source: "#C3EBFF",
    energy_storage_in: "#A0CEE5",
    energy_storage_out: "#7FB6D2",
    energy_storage_supply: "#B4DAF0",
    home_load: "#6DA9C7",
    grid_import: "#5B96B4",
    grid_export: "#D8F1FF",
    track_blend: 0.20,
  },
  preset_5: {
    track: "#4A7D52",
    text_light: "#F2FAF3",
    text_dark: "#1A3320",
    divider: "#C8E1CC",
    energy_source: "#E8F4EA",
    energy_storage_in: "#D2E7D6",
    energy_storage_out: "#B8D8BE",
    energy_storage_supply: "#DEEEE1",
    home_load: "#C8E1CC",
    grid_import: "#A8CAB0",
    grid_export: "#F2FAF3",
    track_blend: 0.20,
  },
};

function getColorPresetOptions() {
  return PRESET_OPTIONS.map((option) => ({ ...option }));
}

function isKnownColorPreset(presetName) {
  return Boolean(COLOR_PRESETS[presetName]);
}

function normalizeColorPresetName(presetName) {
  return isKnownColorPreset(presetName) ? presetName : "preset_1";
}

function resolveColorPresetTokens(presetName) {
  const normalizedName = normalizeColorPresetName(presetName);
  return {
    ...pickColorTokens(COLOR_PRESETS[normalizedName] || {}),
  };
}

function mergeColorPresetTokens(presetName, fallbackTokens, manualOverrides) {
  const presetTokens = resolveColorPresetTokens(presetName);
  return {
    ...(fallbackTokens || {}),
    ...presetTokens,
    ...filterDefinedEntries(manualOverrides),
  };
}

function resolveColorPresetTrackBlend(presetName, fallbackTrackBlend) {
  const normalizedName = normalizeColorPresetName(presetName);
  const trackBlend = COLOR_PRESETS[normalizedName]?.track_blend;
  return Number.isFinite(trackBlend) ? trackBlend : fallbackTrackBlend;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function filterDefinedEntries(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.entries(value).reduce((result, [key, entry]) => {
    if (entry !== undefined && entry !== null) {
      result[key] = entry;
    }
    return result;
  }, {});
}

function pickColorTokens(preset) {
  return COLOR_TOKEN_KEYS.reduce((result, key) => {
    if (preset[key] !== undefined) {
      result[key] = preset[key];
    }
    return result;
  }, {});
}

/* src/_shared/interaction.js */
function openMoreInfo(host, hass, entityId) {
  if (!entityId) {
    return;
  }

  if (typeof hass?.moreInfo === "function") {
    hass.moreInfo(entityId);
    return;
  }

  const moreInfo = new Event("hass-more-info", {
    bubbles: true,
    composed: true,
  });
  moreInfo.detail = { entityId };
  host.dispatchEvent(moreInfo);
}

/* src/_shared/signature.js */
function computeEntitySignature(hass, entityIds) {
  return entityIds
    .map((entityId) => {
      const state = hass?.states?.[entityId];
      if (!state) {
        return `${entityId}:missing`;
      }
      const unit = state.attributes?.unit_of_measurement ?? "";
      return `${entityId}:${state.state}:${unit}`;
    })
    .join("|");
}

/* src/validate.js */
function validateConfig(config) {
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

function normalizeConfig(config) {
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

/* src/house-energy-bar-card.js */
const FIXED_LINE_GAP_PX = 3;
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "house-energy-bar-editor";
const CONFIG_CLEANUP_STEPS = [
  createRemovePathsCleanup(["segment_tokens"]),
  migrateLegacyHouseEnergyColors,
];
const EDITOR_CLEANUP_STEPS = [
  createRemovePathsCleanup(["decimals", "segment_tokens"]),
  migrateLegacyHouseEnergyColors,
];
const SEGMENT_DEFS = SEGMENT_IDS.map((segmentId, index) => ({
  id: segmentId,
  number: index + 1,
  label: SEGMENT_LABELS[segmentId] || `Segment ${index + 1}`,
  primaryKey: SEGMENT_ENTITY_MAP[segmentId].primary,
  secondaryKeys: SEGMENT_ENTITY_MAP[segmentId].secondaries,
}));
class HouseEnergyBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._lastSignature = "";
    this._refs = null;
    this._onClick = (event) => this._handleClick(event);
  }

  static getStubConfig() {
    const { type: _ignoredType, ...rest } = DEFAULT_CONFIG;
    return structuredClone ? structuredClone(rest) : JSON.parse(JSON.stringify(rest));
  }

  static async getConfigElement() {
    if (!customElements.get(EDITOR_ELEMENT_TAG)) {
      customElements.define(EDITOR_ELEMENT_TAG, HouseEnergyBarEditor);
    }
    return document.createElement(EDITOR_ELEMENT_TAG);
  }

  connectedCallback() {
    this._ensureRendered();
    this._refs.shell.addEventListener("click", this._onClick);
    if (this._config) {
      this._applyTheme();
      this._renderModel();
    }
  }

  disconnectedCallback() {
    if (this._refs?.shell) {
      this._refs.shell.removeEventListener("click", this._onClick);
    }
  }

  setConfig(config) {
    const cleanup = runConfigCleanup(config, CONFIG_CLEANUP_STEPS);
    const normalized = normalizeConfig(cleanup.config);
    validateConfig(normalized);
    this._config = normalized;
    this._lastSignature = "";

    this._ensureRendered();
    this._applyTheme();
    this._renderModel();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }

    this._ensureRendered();

    const relevant = collectRelevantEntities(this._config);
    const signature = computeEntitySignature(hass, relevant);
    if (signature === this._lastSignature) {
      return;
    }

    this._lastSignature = signature;
    this._applyTheme();
    this._renderModel();
  }

  getCardSize() {
    return 1;
  }

  _ensureRendered() {
    if (this._rendered) {
      return;
    }
    this._renderStatic();
    this._rendered = true;
  }

  _renderStatic() {
    this.shadowRoot.innerHTML = `
      <ha-card>
        <div class="shell">
          ${SEGMENT_DEFS.map((segment) => buildSegmentSectionMarkup(segment)).join("")}
        </div>
      </ha-card>
      ${styles()}
    `;

    this._refs = {
      shell: this.shadowRoot.querySelector(".shell"),
      segments: SEGMENT_DEFS.reduce((result, segment) => {
        const section = this.shadowRoot.querySelector(`[data-segment="${segment.id}"]`);
        result[segment.id] = {
          section,
          chipRow: section?.querySelector(".chip-row") || null,
          primary: section?.querySelector(`[data-ref="${segment.id}-primary"]`) || null,
          secondaries: [
            section?.querySelector(`[data-ref="${segment.id}-secondary-1"]`) || null,
            section?.querySelector(`[data-ref="${segment.id}-secondary-2"]`) || null,
          ],
        };
        return result;
      }, {}),
    };
  }

  _renderModel() {
    const config = this._config || DEFAULT_CONFIG;
    const model = buildCardModel(config, this._hass);
    const visibleSegments = getVisibleSegmentDefs(config, model);
    const firstVisibleId = visibleSegments[0]?.id || "";
    const visibleIds = new Set(visibleSegments.map((segment) => segment.id));

    this.style.setProperty("--bb-columns", resolveColumnsTemplate(visibleSegments.length));

    SEGMENT_DEFS.forEach((segment) => {
      const segmentRefs = this._refs?.segments?.[segment.id];
      const segmentModel = model[segment.id];
      if (!segmentRefs || !segmentModel) {
        return;
      }

      const isVisible = visibleIds.has(segment.id);
      if (segmentRefs.section) {
        segmentRefs.section.hidden = !isVisible;
        segmentRefs.section.classList.toggle("section--first-visible", isVisible && segment.id === firstVisibleId);
        segmentRefs.section.classList.toggle("section--lead", isVisible && segment.id === firstVisibleId);
      }
      if (!isVisible) {
        return;
      }

      applyMetric(segmentRefs.primary, segmentModel.primary, { settleOnChange: true });
      segmentRefs.secondaries.forEach((secondaryRef, index) => {
        applyMetric(secondaryRef, segmentModel.chips[index], { hideWhenUnavailable: true });
      });
      syncChipRowVisibility(segmentRefs.chipRow, ...segmentRefs.secondaries);
    });

    this._applySectionBackgrounds(config.colors || DEFAULT_CONFIG.colors, config.track_blend, config.fade_between_segments, visibleSegments);
  }

  _applyTheme() {
    const config = this._config || DEFAULT_CONFIG;
    const colors = config.colors || DEFAULT_CONFIG.colors;
    const trackTextColor = pickBestTextColor(colors.track, colors.text_light, colors.text_dark);

    this.style.setProperty("--bb-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--bb-radius", `${config.corner_radius}px`);
    this.style.setProperty("--bb-card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--bb-track-bg", colors.track);
    this.style.setProperty("--bb-text", trackTextColor);
    this.style.setProperty("--bb-line-gap", `${FIXED_LINE_GAP_PX}px`);
    this.style.setProperty("--bb-primary-font-segment1", "17px");
    this.style.setProperty("--bb-primary-font-segment", "17px");
    this.style.setProperty("--bb-chip-font", "12px");
    this.style.setProperty("--bb-divider", colors.divider);
    this.style.setProperty("--bb-divider-opacity", config.show_divider ? "1" : "0");
  }

  _applySectionBackgrounds(colors, trackBlend, fadeBetweenSegments, visibleSegments) {
    const trackColor = normalizeHexColor(colors.track, DEFAULT_CONFIG.colors.track);
    const blendAmount = clamp(0.1, Number(trackBlend) || DEFAULT_CONFIG.track_blend, 0.4);
    const activeSegments = Array.isArray(visibleSegments) && visibleSegments.length > 0
      ? visibleSegments
      : getVisibleSegmentDefs(this._config || DEFAULT_CONFIG, null);
    const blendedColors = activeSegments.map((segment) => {
      const tokenKey = SEGMENT_COLOR_TOKENS[segment.id];
      const segmentColor = normalizeHexColor(colors[tokenKey], trackColor);
      return blendHex(trackColor, segmentColor, blendAmount);
    });

    SEGMENT_DEFS.forEach((segment) => {
      const section = this._refs?.segments?.[segment.id]?.section;
      if (!section) {
        return;
      }
      const visibleIndex = activeSegments.findIndex((entry) => entry.id === segment.id);
      if (visibleIndex === -1) {
        section.style.background = "";
        section.style.color = "";
        return;
      }
      const background = buildSegmentBackground(
        blendedColors[visibleIndex],
        visibleIndex > 0 ? blendedColors[visibleIndex - 1] : null,
        visibleIndex < (blendedColors.length - 1) ? blendedColors[visibleIndex + 1] : null,
        fadeBetweenSegments,
      );
      section.style.background = background;
      section.style.color = pickBestTextColor(blendedColors[visibleIndex], colors.text_light, colors.text_dark);
    });
  }

  _handleClick(event) {
    const button = event.target?.closest?.(".metric-button");
    if (!button || !this._refs?.shell?.contains(button)) {
      return;
    }

    const entityId = button.dataset.entityId;
    if (!entityId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    openMoreInfo(this, this._hass, entityId);
  }
}

class HouseEnergyBarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._rawConfig = null;
    this._hass = null;
    this._form = null;
    this._cleanupState = {
      pendingKey: "",
      lastAppliedKey: "",
    };
    this._onFormValueChanged = (event) => this._handleFormValueChanged(event);
  }

  setConfig(config) {
    const incoming = config && typeof config === "object" ? config : {};
    const cleanup = runConfigCleanup(incoming, EDITOR_CLEANUP_STEPS);
    this._rawConfig = {
      ...cleanup.config,
      type: cleanup.config.type || incoming.type || CARD_TYPE,
    };
    this._rawConfig.color_preset = normalizeColorPresetName(this._rawConfig.color_preset);
    this._config = normalizeConfig(this._rawConfig);
    this._render();
    if (cleanup.changed) {
      queueConfigCleanup(this, this._rawConfig, this._cleanupState);
    }
  }

  set hass(hass) {
    this._hass = hass;
    syncEditorFormsHass([this._form], hass);
  }

  connectedCallback() {
    this._render();
    flushConfigCleanup(this, this._cleanupState);
  }

  disconnectedCallback() {
    this._form?.removeEventListener("value-changed", this._onFormValueChanged);
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    if (!this._form) {
      this.shadowRoot.innerHTML = `
        <div class="editor-shell">
          <ha-form class="editor-form"></ha-form>
        </div>
        ${editorStyles()}
      `;
      this._form = this.shadowRoot.querySelector(".editor-form");
      this._form?.addEventListener("value-changed", this._onFormValueChanged);
    }

    if (!this._form) {
      return;
    }

    const config = this._config || normalizeConfig(HouseEnergyBarCard.getStubConfig());
    this._form.hass = this._hass;
    this._form.schema = buildEditorFormSchema(this._rawConfig);
    this._form.data = buildHouseEditorFormData(config, this._rawConfig);
    this._form.computeLabel = (schema) => schema.label || schema.name || "";
  }

  _handleFormValueChanged(event) {
    event.stopPropagation();
    const value = event?.detail?.value;
    if (!value || typeof value !== "object") {
      return;
    }

    const useOverrides = value.use_color_overrides === true;
    const hadOverrides = hasColorOverrides(this._rawConfig);
    const nextRaw = {
      ...(this._rawConfig || {}),
      ...value,
      type: CARD_TYPE,
      color_preset: normalizeColorPresetName(value.color_preset ?? this._rawConfig?.color_preset),
    };
    delete nextRaw.use_color_overrides;
    if (value.fade_between_segments === true) {
      nextRaw.fade_between_segments = true;
    } else {
      delete nextRaw.fade_between_segments;
    }
    if (value.show_solar_segment === true) {
      nextRaw.show_solar_segment = true;
    } else {
      delete nextRaw.show_solar_segment;
    }

    if (useOverrides) {
      nextRaw.colors = {
        ...resolveEditorBackgroundColor(value.colors, this._rawConfig?.colors),
        ...pickHouseColorOverrides(this._config?.colors || DEFAULT_CONFIG.colors),
        ...(hadOverrides ? pickHouseEditorColorOverrides(value.colors) : {}),
      };
      nextRaw.track_blend = normalizeTrackBlendOverrideValue(
        value.track_blend,
        this._config?.track_blend ?? DEFAULT_CONFIG.track_blend,
      );
    } else {
      nextRaw.colors = {
        ...resolveEditorBackgroundColor(value.colors, this._rawConfig?.colors),
      };
      delete nextRaw.track_blend;
      if (Object.keys(nextRaw.colors).length === 0) {
        delete nextRaw.colors;
      }
    }

    this._rawConfig = nextRaw;
    this._config = normalizeConfig(this._rawConfig);

    this._render();
    emitConfigChanged(this, this._rawConfig);
  }
}

function applyMetric(button, metric, options = {}) {
  if (!button) {
    return;
  }

  const nextValue = metric?.value || "—";
  const previousValue = button.dataset.metricValue || "";
  const valueEl = button.querySelector(".metric-text");
  if (valueEl) {
    valueEl.textContent = nextValue;
  }

  button.dataset.metricValue = nextValue;
  button.dataset.entityId = metric?.entityId || "";
  button.disabled = !metric?.available;
  button.title = metric?.title || "";
  button.setAttribute("aria-label", metric?.title || "Energy metric");
  button.hidden = Boolean(options.hideWhenUnavailable && !metric?.configured);

  const iconEl = button.querySelector(".metric-icon");
  if (iconEl) {
    const icon = metric?.icon || "";
    if (icon) {
      iconEl.setAttribute("icon", icon);
      iconEl.hidden = false;
    } else {
      iconEl.removeAttribute("icon");
      iconEl.hidden = true;
    }
  }

  if (options.settleOnChange && shouldAnimatePrimarySettle(previousValue, nextValue)) {
    animatePrimarySettle(button);
  }
}

function syncChipRowVisibility(row, ...buttons) {
  if (!row) {
    return;
  }
  const hasVisibleChip = buttons.some((button) => button && button.hidden !== true);
  row.hidden = !hasVisibleChip;
}

function buildSegmentSectionMarkup(segment) {
  return `
    <section class="section section--segment" aria-label="${segment.label}" data-segment="${segment.id}">
      <div class="primary-row">
        ${buildMetricButton(`${segment.id}-primary`, true)}
      </div>
      <div class="chip-row chip-row--segment">
        ${buildMetricButton(`${segment.id}-secondary-1`, false)}
        ${buildMetricButton(`${segment.id}-secondary-2`, false)}
      </div>
    </section>
  `;
}

function buildMetricButton(ref, primary) {
  const buttonClass = primary ? "metric-button metric-button--primary" : "metric-button metric-button--chip";
  const iconClass = primary ? "metric-icon metric-icon--primary" : "metric-icon metric-icon--chip";
  return `
    <button class="${buttonClass}" data-ref="${ref}" type="button">
      <ha-icon class="${iconClass}" hidden></ha-icon>
      <span class="metric-text">—</span>
    </button>
  `;
}

function shouldAnimatePrimarySettle(previousValue, nextValue) {
  return Boolean(previousValue)
    && previousValue !== nextValue
    && previousValue !== "—"
    && nextValue !== "—";
}

function animatePrimarySettle(button) {
  if (!button?.animate) {
    return;
  }
  button.getAnimations().forEach((animation) => {
    if (animation.id === "primary-settle") {
      animation.cancel();
    }
  });
  const animation = button.animate(
    [
      { transform: "translateY(1.5px)", opacity: 0.84 },
      { transform: "translateY(0)", opacity: 1 },
    ],
    {
      duration: PRIMARY_SETTLE_DURATION_MS,
      easing: COLOR_EASING,
      fill: "none",
    },
  );
  animation.id = "primary-settle";
}

function styles() {
  return `
    <style>
      :host {
        display: block;
        --bb-bar-height: 56px;
        --bb-radius: 28px;
        --bb-card-bg: #000000;
        --bb-track-bg: #eaecef;
        --bb-columns: minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr);
        --bb-text: #2e2e2e;
        --bb-line-gap: 3px;
        --bb-primary-font-segment1: 17px;
        --bb-primary-font-segment: 17px;
        --bb-chip-font: 12px;
        --bb-divider: #dbdde0;
        --bb-divider-opacity: 0;
        color: var(--bb-text);
      }

      * {
        box-sizing: border-box;
      }

      ha-card {
        background: var(--bb-card-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        box-shadow: none !important;
        border: 0 !important;
      }

      .shell {
        width: 100%;
        height: var(--bb-bar-height);
        display: grid;
        grid-template-columns: var(--bb-columns);
        align-items: stretch;
        background: var(--bb-track-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        border-radius: var(--bb-radius);
        overflow: hidden;
      }

      .section {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--bb-line-gap);
        padding: 0 10px;
        position: relative;
        transition: background ${COLOR_TRANSITION};
      }

      .section[hidden] {
        display: none !important;
      }

      .section + .section::before {
        content: "";
        position: absolute;
        left: 0;
        top: 18%;
        width: 1px;
        height: 64%;
        background: color-mix(in srgb, var(--bb-divider) 58%, transparent);
        opacity: var(--bb-divider-opacity);
      }

      .section--first-visible::before {
        content: none;
      }

      .section--lead {
        align-items: center;
        text-align: center;
      }

      .section--segment {
        align-items: center;
      }

      .primary-row,
      .chip-row {
        width: 100%;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chip-row--segment {
        gap: 10px;
      }

      .chip-row[hidden],
      .metric-button[hidden] {
        display: none !important;
      }

      .metric-button {
        min-width: 0;
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        font-variant-numeric: tabular-nums;
      }

      .metric-button:focus-visible {
        outline: 2px solid var(--primary-color, #03a9f4);
        outline-offset: 2px;
        border-radius: 8px;
      }

      .metric-button:disabled {
        cursor: default;
      }

      .metric-button--primary {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }

      .metric-button--chip {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        line-height: 1;
        position: relative;
      }

      .metric-icon {
        flex: 0 0 auto;
        display: block;
        align-self: center;
        margin: 0;
        padding: 0;
        vertical-align: middle;
        line-height: 1;
      }

      .metric-icon--primary {
        width: calc(var(--bb-primary-font-segment) * 0.92);
        height: calc(var(--bb-primary-font-segment) * 0.92);
        --mdc-icon-size: calc(var(--bb-primary-font-segment) * 0.92);
        color: color-mix(in srgb, currentColor 88%, transparent);
      }

      .section--lead .metric-icon--primary {
        width: calc(var(--bb-primary-font-segment1) * 0.92);
        height: calc(var(--bb-primary-font-segment1) * 0.92);
        --mdc-icon-size: calc(var(--bb-primary-font-segment1) * 0.92);
      }

      .metric-icon--chip {
        width: auto;
        height: auto;
        --mdc-icon-size: calc(var(--bb-chip-font) * 0.9);
        color: color-mix(in srgb, currentColor 82%, transparent);
        transform: translateY(0.01em);
      }

      .metric-text {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metric-button--primary .metric-text {
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
      }

      .section--lead .metric-button--primary .metric-text {
        font-size: var(--bb-primary-font-segment1);
      }

      .section--segment .metric-button--primary .metric-text {
        font-size: var(--bb-primary-font-segment);
      }

      .metric-button--chip .metric-text {
        display: block;
        font-size: var(--bb-chip-font);
        font-weight: 400;
        line-height: 1;
        align-self: center;
      }
    </style>
  `;
}

function registerCustomCardMetadata(type, name, description) {
  window.customCards = window.customCards || [];
  if (window.customCards.some((item) => item.type === type)) {
    return;
  }
  window.customCards.push({
    type,
    name,
    description,
    preview: true,
  });
}

function registerCard() {
  if (!customElements.get(CARD_ELEMENT_TAG)) {
    customElements.define(CARD_ELEMENT_TAG, HouseEnergyBarCard);
  }

  registerCustomCardMetadata(
    CARD_ELEMENT_TAG,
    CARD_NAME,
    "House Energy Bar: compact metric overview with an optional solar lead segment for Home Assistant.",
  );
}

function buildTopFormSchema() {
  const colorSelector = { text: {} };

  return [
    {
      type: "expandable",
      title: "Layout & Motion",
      schema: [
        {
          name: "bar_height",
          label: "Bar height (px)",
          required: true,
          selector: { number: { min: 24, max: 72, step: 1, mode: "slider" } },
        },
        {
          name: "corner_radius",
          label: "Corner radius (px)",
          required: true,
          selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } },
        },
        {
          type: "grid",
          name: "colors",
          schema: [
            { name: "background", label: "Card background color", required: false, selector: colorSelector },
          ],
        },
        { name: "background_transparent", label: "Use transparent card background", selector: { boolean: {} } },
        { name: "show_divider", label: "Show separators between segments", selector: { boolean: {} } },
      ],
    },
  ];
}

function buildBottomFormSchema(showSolarSegment) {
  const entitySelector = { entity: { domain: ["sensor", "input_number"] } };
  const entitySchema = [];

  if (showSolarSegment) {
    entitySchema.push(
      { name: "pv_primary", label: "PV top row entity", selector: entitySelector },
      { name: "pv_secondary_1", label: "PV second row entity 1", selector: entitySelector },
      { name: "pv_secondary_2", label: "PV second row entity 2", selector: entitySelector },
    );
  }

  entitySchema.push(
    { name: "grid_import_primary", label: "Grid import top row entity", required: true, selector: entitySelector },
    { name: "grid_import_secondary_1", label: "Grid import second row entity 1", selector: entitySelector },
    { name: "grid_import_secondary_2", label: "Grid import second row entity 2", selector: entitySelector },
    { name: "battery_output_primary", label: "Battery output top row entity", required: true, selector: entitySelector },
    { name: "battery_output_secondary_1", label: "Battery output second row entity 1", selector: entitySelector },
    { name: "battery_output_secondary_2", label: "Battery output second row entity 2", selector: entitySelector },
    { name: "grid_export_primary", label: "Grid export top row entity", required: true, selector: entitySelector },
    { name: "grid_export_secondary_1", label: "Grid export second row entity 1", selector: entitySelector },
    { name: "grid_export_secondary_2", label: "Grid export second row entity 2", selector: entitySelector },
  );

  return [
    {
      type: "expandable",
      title: "Entities",
      schema: [
        { name: "show_solar_segment", label: "Show solar segment", selector: { boolean: {} } },
        {
          type: "grid",
          name: "entities",
          column_min_width: "100%",
          schema: entitySchema,
        },
      ],
    },
  ];
}

function buildColorOverridesGridSchema() {
  const colorSelector = { text: {} };

  return [
    { name: "track", label: "Base track color", required: false, selector: colorSelector },
    { name: "text_light", label: "Light text and icon color", required: false, selector: colorSelector },
    { name: "text_dark", label: "Dark text and icon color", required: false, selector: colorSelector },
    { name: "divider", label: "Divider line color", required: false, selector: colorSelector },
    { name: "energy_source", label: "PV color", required: false, selector: colorSelector },
    { name: "energy_storage_supply", label: "Battery output color", required: false, selector: colorSelector },
    { name: "grid_import", label: "Grid import color", required: false, selector: colorSelector },
    { name: "grid_export", label: "Grid export color", required: false, selector: colorSelector },
  ];
}

function buildColorSectionSchema(showOverrides) {
  const schema = [
    {
      name: "color_preset",
      label: "Color preset",
      required: false,
      selector: {
        select: {
          mode: "dropdown",
          options: getColorPresetOptions(),
        },
      },
    },
    {
      name: "use_color_overrides",
      label: "Use custom color overrides",
      required: false,
      selector: { boolean: {} },
    },
    {
      name: "fade_between_segments",
      label: "Fade between neighboring segments",
      required: false,
      selector: { boolean: {} },
    },
  ];

  if (showOverrides) {
    schema.push({
      name: "track_blend",
      label: "Track blend",
      required: false,
      selector: { number: { min: 0.1, max: 0.4, step: 0.01, mode: "slider" } },
    });
    schema.push({
      type: "grid",
      name: "colors",
      schema: buildColorOverridesGridSchema(),
    });
  }

  return [
    {
      type: "expandable",
      title: "Colors",
      schema,
    },
  ];
}

function buildEditorFormSchema(rawConfig) {
  return [
    ...buildTopFormSchema(),
    ...buildColorSectionSchema(hasColorOverrides(rawConfig)),
    ...buildBottomFormSchema(rawConfig?.show_solar_segment === true),
  ];
}

function buildHouseEditorFormData(config, rawConfig) {
  return {
    ...config,
    use_color_overrides: hasColorOverrides(rawConfig),
    track_blend: resolveEditorTrackBlend(rawConfig, config.track_blend),
    colors: {
      ...pickBackgroundColor(rawConfig?.colors),
      ...pickHouseEditorColorOverrides(rawConfig?.colors),
    },
  };
}

function buildTopFormData(config) {
  return {
    bar_height: config.bar_height,
    corner_radius: config.corner_radius,
    show_solar_segment: config.show_solar_segment,
    background_transparent: config.background_transparent,
    show_divider: config.show_divider,
    colors: pickBackgroundColor(config?.colors),
  };
}

function hasColorOverrides(config) {
  const colors = config?.colors;
  const hasTokenOverrides = Boolean(colors)
    && typeof colors === "object"
    && Object.entries(colors).some(
      ([key, value]) => key !== "background" && typeof value === "string" && value.trim().length > 0,
    );
  const trackBlend = Number(config?.track_blend);
  return hasTokenOverrides || Number.isFinite(trackBlend);
}

function editorStyles() {
  return `
    <style>
      .editor-shell {
        display: grid;
        gap: 12px;
      }
    </style>
  `;
}

function syncEditorFormsHass(forms, hass) {
  for (const form of forms) {
    if (form) {
      form.hass = hass;
    }
  }
}

function pickHouseColorOverrides(colors) {
  const source = colors && typeof colors === "object" ? colors : {};
  return {
    track: source.track || DEFAULT_CONFIG.colors.track,
    text_light: source.text_light || source.text || DEFAULT_CONFIG.colors.text_light,
    text_dark: source.text_dark || source.text || DEFAULT_CONFIG.colors.text_dark,
    divider: source.divider || DEFAULT_CONFIG.colors.divider,
    energy_source: source.energy_source || DEFAULT_CONFIG.colors.energy_source,
    energy_storage_supply: source.energy_storage_supply || DEFAULT_CONFIG.colors.energy_storage_supply,
    grid_import: source.grid_import || DEFAULT_CONFIG.colors.grid_import,
    grid_export: source.grid_export || DEFAULT_CONFIG.colors.grid_export,
  };
}

function pickHouseEditorColorOverrides(colors) {
  const source = colors && typeof colors === "object" ? colors : {};
  return {
    track: source.track || "",
    text_light: source.text_light || source.text || "",
    text_dark: source.text_dark || source.text || "",
    divider: source.divider || "",
    energy_source: source.energy_source || "",
    energy_storage_supply: source.energy_storage_supply || "",
    grid_import: source.grid_import || "",
    grid_export: source.grid_export || "",
  };
}

function pickBackgroundColor(colors) {
  if (!colors || typeof colors !== "object" || typeof colors.background !== "string" || colors.background.trim().length === 0) {
    return {};
  }
  const background = colors.background.trim();
  if (background.toUpperCase() === DEFAULT_CONFIG.colors.background) {
    return {};
  }
  return { background };
}

function resolveEditorBackgroundColor(formColors, fallbackColors) {
  if (formColors && typeof formColors === "object" && Object.prototype.hasOwnProperty.call(formColors, "background")) {
    return pickBackgroundColor(formColors);
  }
  return pickBackgroundColor(fallbackColors);
}

function resolveEditorTrackBlend(rawConfig, fallback) {
  const trackBlend = Number(rawConfig?.track_blend);
  if (!Number.isFinite(trackBlend)) {
    return fallback;
  }
  return Math.min(0.4, Math.max(0.1, trackBlend));
}

function normalizeTrackBlendOverrideValue(value, fallback) {
  const trackBlend = Number(value);
  if (!Number.isFinite(trackBlend)) {
    return fallback;
  }
  return Math.min(0.4, Math.max(0.1, trackBlend));
}

function migrateLegacyHouseEnergyColors(config) {
  if (!config || typeof config !== "object" || !config.colors || typeof config.colors !== "object") {
    return config;
  }

  const colors = config.colors;
  const nextColors = {
    ...colors,
  };
  let changed = false;

  changed = moveLegacyHouseColor(nextColors, "segment1", "grid_import") || changed;
  changed = moveLegacyHouseColor(nextColors, "segment2", "energy_storage_supply") || changed;
  changed = moveLegacyHouseColor(nextColors, "segment3", "grid_export") || changed;
  if (!nextColors.text_light && typeof colors.text === "string") {
    nextColors.text_light = colors.text;
    changed = true;
  }
  if (!nextColors.text_dark && typeof colors.text === "string") {
    nextColors.text_dark = colors.text;
    changed = true;
  }
  if ("text" in nextColors) {
    delete nextColors.text;
    changed = true;
  }

  if (!changed) {
    return config;
  }

  return {
    ...config,
    colors: nextColors,
  };
}

function moveLegacyHouseColor(colors, legacyKey, nextKey) {
  let changed = false;

  if (!colors[nextKey] && typeof colors[legacyKey] === "string") {
    colors[nextKey] = colors[legacyKey];
    changed = true;
  }

  if (legacyKey in colors) {
    delete colors[legacyKey];
    changed = true;
  }

  return changed;
}

function getVisibleSegmentDefs(config, model) {
  return SEGMENT_DEFS.filter((segment) => {
    if (segment.id !== PV_SEGMENT_ID) {
      return true;
    }
    if (config?.show_solar_segment !== true) {
      return false;
    }
    return Boolean(model?.[PV_SEGMENT_ID]?.primary?.configured);
  });
}

function resolveColumnsTemplate(visibleCount) {
  if (visibleCount >= 4) {
    return "repeat(4, minmax(0, 1fr))";
  }
  return "minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr)";
}

/* src/index.js */
registerCard();
