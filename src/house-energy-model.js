import { resolveEntityStatus } from "./_shared/availability.js";
import { formatEntityStateValue } from "./_shared/entity-format.js";
import {
  ENTITY_KEYS,
  PV_SEGMENT_ID,
  SEGMENT_ENTITY_MAP,
  SEGMENT_IDS,
  SEGMENT_LABELS,
} from "./constants.js";

const DEFAULT_METRIC_ICONS = {
  secondary: "mdi:information-outline",
  [SEGMENT_ENTITY_MAP[PV_SEGMENT_ID].primary]: "mdi:white-balance-sunny",
  [SEGMENT_ENTITY_MAP.grid_import.primary]: "mdi:transmission-tower-import",
  [SEGMENT_ENTITY_MAP.battery_output.primary]: "mdi:power-socket-de",
  [SEGMENT_ENTITY_MAP.grid_export.primary]: "mdi:transmission-tower-export",
};

export function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  return ENTITY_KEYS
    .map((key) => entities[key])
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

export function buildCardModel(config, hass) {
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
