import { resolveEntityStatus } from "./_shared/availability.js";
import { formatEntityStateValue } from "./_shared/entity-format.js";
import {
  ENTITY_KEYS,
  SEGMENT_ENTITY_MAP,
  SEGMENT_IDS,
} from "./constants.js";

export function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  return ENTITY_KEYS
    .map((key) => entities[key])
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

export function buildCardModel(config, hass) {
  const entities = config?.entities || {};
  const model = {};

  SEGMENT_IDS.forEach((segmentId) => {
    const segmentDef = SEGMENT_ENTITY_MAP[segmentId];
    model[segmentId] = {
      primary: buildMetricView(
        hass,
        entities[segmentDef.primary],
      ),
      chips: segmentDef.secondaries.map((secondaryKey) => buildMetricView(
        hass,
        entities[secondaryKey],
      )),
    };
  });

  return model;
}

function buildMetricView(hass, entityId) {
  const stateObj = entityId ? hass?.states?.[entityId] : null;
  const status = resolveEntityStatus(entityId, stateObj);
  const label = `${stateObj?.attributes?.friendly_name ?? ""}`.trim() || `${entityId ?? ""}`.trim();
  const value = formatMetricValue(hass, stateObj);

  return {
    entityId: status === "ready" ? entityId || "" : "",
    stateObj: stateObj || null,
    value,
    title: buildMetricTitle(label, value, status),
    available: status === "ready",
    configured: status !== "omitted",
    status,
  };
}

function buildMetricTitle(label, value, status) {
  if (status === "ready") {
    return label ? `${label}: ${value}` : value;
  }
  if (status === "omitted") {
    return "";
  }
  return label ? `${label}: unavailable` : "unavailable";
}

function formatMetricValue(hass, stateObj) {
  return formatEntityStateValue(hass, stateObj);
}
