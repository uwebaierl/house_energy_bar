import { ENTITY_KEYS, SEGMENT_ENTITY_MAP, SEGMENT_IDS } from "./constants.js";

const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);
const formatterCache = new Map();
const DEFAULT_METRIC_ICONS = {
  secondary: "mdi:information-outline",
  ...Object.fromEntries(
    SEGMENT_IDS.map((segmentId, index) => [SEGMENT_ENTITY_MAP[segmentId].primary, `mdi:numeric-${index + 1}-circle-outline`]),
  ),
};

export function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  return ENTITY_KEYS
    .map((key) => entities[key])
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

export function computeEntitySignature(hass, entityIds) {
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

export function buildCardModel(config, hass) {
  const entities = config?.entities || {};
  const decimals = config?.decimals || {};
  const model = {};

  SEGMENT_IDS.forEach((segmentId, index) => {
    const segmentIndex = index + 1;
    const segmentDef = SEGMENT_ENTITY_MAP[segmentId];
    model[segmentId] = {
      primary: buildMetricView(
        hass,
        entities[segmentDef.primary],
        segmentDef.primary,
        decimals.primary,
        `Segment ${segmentIndex}`,
      ),
      chips: segmentDef.secondaries.map((secondaryKey, chipIndex) => buildMetricView(
        hass,
        entities[secondaryKey],
        "secondary",
        decimals.secondary,
        `Segment ${segmentIndex} detail ${chipIndex + 1}`,
      )),
    };
  });

  return model;
}

function buildMetricView(hass, entityId, kind, decimals, fallbackLabel) {
  const stateObj = entityId ? hass?.states?.[entityId] : null;
  const friendlyName = stateObj?.attributes?.friendly_name || fallbackLabel;
  const value = formatMetricValue(stateObj, decimals);
  const rawState = `${stateObj?.state ?? ""}`.trim();
  const available = Boolean(entityId && stateObj && !isUnavailable(rawState));

  return {
    entityId: entityId || "",
    icon: resolveMetricIcon(stateObj, kind),
    value,
    title: entityId ? `${friendlyName}: ${value}` : fallbackLabel,
    available,
  };
}

function resolveMetricIcon(stateObj, kind) {
  const explicitIcon = `${stateObj?.attributes?.icon ?? ""}`.trim();
  if (explicitIcon) {
    return explicitIcon;
  }
  return DEFAULT_METRIC_ICONS[kind] || "";
}

function formatMetricValue(stateObj, decimals) {
  if (!stateObj) {
    return "—";
  }

  const raw = `${stateObj.state ?? ""}`.trim();
  if (isUnavailable(raw)) {
    return "—";
  }

  const numeric = parseNumericState(raw);
  if (numeric === null) {
    return raw;
  }

  const unit = `${stateObj.attributes?.unit_of_measurement ?? ""}`.trim();
  const suffix = unit ? ` ${unit}` : "";
  return `${formatNumber(numeric, decimals)}${suffix}`;
}

function parseNumericState(raw) {
  const trimmed = `${raw ?? ""}`.trim();
  if (!trimmed) {
    return null;
  }

  const direct = Number(trimmed);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const normalized = trimmed.replace(",", ".");
  const match = normalized.match(/^-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value, decimals) {
  const precision = Number.isInteger(Number(decimals)) ? Number(decimals) : 0;
  const key = `${precision}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
    formatterCache.set(key, formatter);
  }
  return formatter.format(value);
}

function isUnavailable(raw) {
  return UNAVAILABLE_STATES.has(`${raw ?? ""}`.trim().toLowerCase());
}
