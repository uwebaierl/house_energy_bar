/* House Energy Bar - generated file. Do not edit directly. */
/* src/constants.js */
const CARD_ELEMENT_TAG = "house-energy-bar";
const CARD_TYPE = "custom:house-energy-bar";
const CARD_NAME = "House Energy Bar";
const SEGMENT_IDS = ["segment1", "segment2", "segment3"];
const SEGMENT_ENTITY_MAP = {
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

const DEFAULT_CONFIG = {
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

const REQUIRED_ENTITY_KEYS = SEGMENT_IDS.map((segmentId) => SEGMENT_ENTITY_MAP[segmentId].primary);
const OPTIONAL_ENTITY_KEYS = SEGMENT_IDS.flatMap((segmentId) => SEGMENT_ENTITY_MAP[segmentId].secondaries);
const ENTITY_KEYS = SEGMENT_IDS.flatMap((segmentId) => [
  SEGMENT_ENTITY_MAP[segmentId].primary,
  ...SEGMENT_ENTITY_MAP[segmentId].secondaries,
]);

const DECIMAL_KEYS = ["primary", "secondary"];
const COLOR_KEYS = ["background", "track", "segment1", "segment2", "segment3", "text", "divider"];

/* src/house-energy-model.js */
const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);
const formatterCache = new Map();
const DEFAULT_METRIC_ICONS = {
  secondary: "mdi:information-outline",
  ...Object.fromEntries(
    SEGMENT_IDS.map((segmentId, index) => [SEGMENT_ENTITY_MAP[segmentId].primary, `mdi:numeric-${index + 1}-circle-outline`]),
  ),
};

function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  return ENTITY_KEYS
    .map((key) => entities[key])
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

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

function buildCardModel(config, hass) {
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
  validateRange(config.track_blend, "track_blend", 0.15, 0.3);
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

  if (!config.decimals || typeof config.decimals !== "object") {
    throw new Error("decimals must be an object.");
  }
  for (const key of DECIMAL_KEYS) {
    validateIntegerRange(config.decimals[key], `decimals.${key}`, 0, 2);
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
  const decimalsInput = source.decimals && typeof source.decimals === "object" ? source.decimals : {};
  const colorsInput = source.colors && typeof source.colors === "object" ? source.colors : {};

  return {
    type: CARD_TYPE,
    bar_height: clampNumber(source.bar_height, 24, 72, DEFAULT_CONFIG.bar_height),
    corner_radius: clampNumber(source.corner_radius, 0, 30, DEFAULT_CONFIG.corner_radius),
    track_blend: clampNumber(source.track_blend, 0.15, 0.3, DEFAULT_CONFIG.track_blend),
    background_transparent: typeof source.background_transparent === "boolean"
      ? source.background_transparent
      : DEFAULT_CONFIG.background_transparent,
    show_divider: typeof source.show_divider === "boolean"
      ? source.show_divider
      : DEFAULT_CONFIG.show_divider,
    entities: normalizeEntities(entitiesInput),
    decimals: normalizeObjectByKeys(
      DECIMAL_KEYS,
      decimalsInput,
      DEFAULT_CONFIG.decimals,
      (value, fallback) => clampDecimal(value, fallback),
    ),
    colors: normalizeObjectByKeys(
      COLOR_KEYS,
      colorsInput,
      DEFAULT_CONFIG.colors,
      (value, fallback) => normalizeColor(value, fallback),
    ),
  };
}

function validateRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

function validateIntegerRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function clampDecimal(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(2, Math.max(0, Math.round(n)));
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

function normalizeObjectByKeys(keys, source, fallback, normalizeValue) {
  return keys.reduce((result, key) => {
    result[key] = normalizeValue(source[key], fallback[key]);
    return result;
  }, {});
}

/* src/house-energy-bar-card.js */
const FIXED_LINE_GAP_PX = 3;
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "house-energy-bar-editor";
const SEGMENT_DEFS = SEGMENT_IDS.map((segmentId, index) => ({
  id: segmentId,
  number: index + 1,
  label: `Segment ${index + 1}`,
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
    const normalized = normalizeConfig(config);
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
    const model = buildCardModel(this._config || DEFAULT_CONFIG, this._hass);

    this.style.setProperty("--bb-columns", "minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr)");

    SEGMENT_DEFS.forEach((segment) => {
      const segmentRefs = this._refs?.segments?.[segment.id];
      const segmentModel = model[segment.id];
      if (!segmentRefs || !segmentModel) {
        return;
      }

      applyMetric(segmentRefs.primary, segmentModel.primary, { settleOnChange: true });
      segmentRefs.secondaries.forEach((secondaryRef, index) => {
        applyMetric(secondaryRef, segmentModel.chips[index], { hideWhenUnavailable: true });
      });
      syncChipRowVisibility(segmentRefs.chipRow, ...segmentRefs.secondaries);
    });
  }

  _applyTheme() {
    const config = this._config || DEFAULT_CONFIG;
    const colors = config.colors || DEFAULT_CONFIG.colors;

    this.style.setProperty("--bb-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--bb-radius", `${config.corner_radius}px`);
    this.style.setProperty("--bb-card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--bb-track-bg", colors.track);
    this.style.setProperty("--bb-text", colors.text);
    this.style.setProperty("--bb-line-gap", `${FIXED_LINE_GAP_PX}px`);
    this.style.setProperty("--bb-primary-font-segment1", "17px");
    this.style.setProperty("--bb-primary-font-segment", "17px");
    this.style.setProperty("--bb-chip-font", "12px");
    this.style.setProperty("--bb-divider", colors.divider);
    this.style.setProperty("--bb-divider-opacity", config.show_divider ? "1" : "0");
    this._applySectionBackgrounds(colors, config.track_blend);
  }

  _applySectionBackgrounds(colors, trackBlend) {
    const trackColor = normalizeHexColor(colors.track, DEFAULT_CONFIG.colors.track);
    const blendAmount = clamp(0.15, Number(trackBlend) || DEFAULT_CONFIG.track_blend, 0.3);
    const blendedColors = SEGMENT_DEFS.map((segment) => {
      const segmentColor = normalizeHexColor(colors[segment.id], trackColor);
      return blendHex(trackColor, segmentColor, blendAmount);
    });

    SEGMENT_DEFS.forEach((segment, index) => {
      const section = this._refs?.segments?.[segment.id]?.section;
      if (!section) {
        return;
      }
      const gradient = buildSmoothSegmentGradient(
        blendedColors[index],
        index > 0 ? blendedColors[index - 1] : null,
        index < (blendedColors.length - 1) ? blendedColors[index + 1] : null,
      );
      section.style.background = gradient;
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
    if (typeof this._hass?.moreInfo === "function") {
      this._hass.moreInfo(entityId);
      return;
    }

    const moreInfo = new Event("hass-more-info", {
      bubbles: true,
      composed: true,
    });
    moreInfo.detail = { entityId };
    this.dispatchEvent(moreInfo);
  }
}

class HouseEnergyBarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._form = null;
    this._onValueChanged = (event) => this._handleValueChanged(event);
  }

  setConfig(config) {
    const incoming = config && typeof config === "object" ? config : {};
    this._config = normalizeConfig({
      ...incoming,
      type: incoming.type || CARD_TYPE,
    });
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
    }
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._form) {
      this._form.removeEventListener("value-changed", this._onValueChanged);
    }
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    if (!this._form) {
      this.shadowRoot.innerHTML = "<ha-form></ha-form>";
      this._form = this.shadowRoot.querySelector("ha-form");
      this._form?.addEventListener("value-changed", this._onValueChanged);
    }

    if (!this._form) {
      return;
    }

    this._form.hass = this._hass;
    this._form.schema = buildConfigFormSchema();
    this._form.data = this._config || normalizeConfig(HouseEnergyBarCard.getStubConfig());
    this._form.computeLabel = (schema) => schema.label || schema.name || "";
  }

  _handleValueChanged(event) {
    event.stopPropagation();
    const value = event?.detail?.value;
    if (!value || typeof value !== "object") {
      return;
    }

    this._config = normalizeConfig({
      ...(this._config || {}),
      ...value,
      type: CARD_TYPE,
    });

    if (this._form) {
      this._form.data = this._config;
    }

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
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
  button.hidden = Boolean(options.hideWhenUnavailable && !metric?.available);

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
  const sectionClass = segment.number === 1 ? "section section--segment1" : "section section--segment";
  return `
    <section class="${sectionClass}" aria-label="${segment.label}" data-segment="${segment.id}">
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

      .section--segment1 {
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
        color: var(--bb-text);
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

      .section--segment1 .metric-icon--primary {
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

      .section--segment1 .metric-button--primary .metric-text {
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
    "House Energy Bar: compact three-segment metric overview for Home Assistant.",
  );
}

function buildSmoothSegmentGradient(centerColor, prevColor, nextColor) {
  const leftBoundary = prevColor ? mixHex(prevColor, centerColor, 0.5) : centerColor;
  const rightBoundary = nextColor ? mixHex(centerColor, nextColor, 0.5) : centerColor;
  return `linear-gradient(90deg, ${leftBoundary} 0%, ${centerColor} 30%, ${centerColor} 70%, ${rightBoundary} 100%)`;
}

function blendHex(baseHex, accentHex, blendAmount) {
  const base = parseHex(baseHex);
  const accent = parseHex(accentHex);

  const blend = clamp(0, blendAmount, 1);
  const keep = 1 - blend;

  const r = Math.round((base.r * blend) + (accent.r * keep));
  const g = Math.round((base.g * blend) + (accent.g * keep));
  const b = Math.round((base.b * blend) + (accent.b * keep));

  return toHex({ r, g, b });
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

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

function buildConfigFormSchema() {
  const entitySelector = { entity: { domain: ["sensor", "input_number"] } };
  const colorSelector = { text: {} };

  return [
    {
      type: "expandable",
      title: "Layout & Styling",
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
          name: "track_blend",
          label: "Track/segment color blend (0.15-0.30)",
          required: true,
          selector: { number: { min: 0.15, max: 0.3, step: 0.01, mode: "slider" } },
        },
        { name: "background_transparent", label: "Use transparent card background", selector: { boolean: {} } },
        { name: "show_divider", label: "Show separators between segments", selector: { boolean: {} } },
      ],
    },
    {
      type: "expandable",
      title: "Colors",
      name: "colors",
      schema: [
        { name: "background", label: "Card background color", required: true, selector: colorSelector },
        { name: "track", label: "Base track color", required: true, selector: colorSelector },
        { name: "segment1", label: "Color for segment 1", required: true, selector: colorSelector },
        { name: "segment2", label: "Color for segment 2", required: true, selector: colorSelector },
        { name: "segment3", label: "Color for segment 3", required: true, selector: colorSelector },
        { name: "text", label: "Text and icon color", required: true, selector: colorSelector },
        { name: "divider", label: "Divider line color", required: true, selector: colorSelector },
      ],
    },
    {
      type: "expandable",
      title: "Decimals",
      name: "decimals",
      schema: [
        { name: "primary", label: "Top row value decimals", required: true, selector: { number: { min: 0, max: 2, step: 1, mode: "box" } } },
        { name: "secondary", label: "Second row value decimals", required: true, selector: { number: { min: 0, max: 2, step: 1, mode: "box" } } },
      ],
    },
    {
      type: "expandable",
      title: "Entities",
      name: "entities",
      schema: [
        { name: "segment1_primary", label: "Segment 1 top row entity", required: true, selector: entitySelector },
        { name: "segment1_secondary_1", label: "Segment 1 second row entity 1", selector: entitySelector },
        { name: "segment1_secondary_2", label: "Segment 1 second row entity 2", selector: entitySelector },
        { name: "segment2_primary", label: "Segment 2 top row entity", required: true, selector: entitySelector },
        { name: "segment2_secondary_1", label: "Segment 2 second row entity 1", selector: entitySelector },
        { name: "segment2_secondary_2", label: "Segment 2 second row entity 2", selector: entitySelector },
        { name: "segment3_primary", label: "Segment 3 top row entity", required: true, selector: entitySelector },
        { name: "segment3_secondary_1", label: "Segment 3 second row entity 1", selector: entitySelector },
        { name: "segment3_secondary_2", label: "Segment 3 second row entity 2", selector: entitySelector },
      ],
    },
  ];
}

function normalizeHexColor(value, fallback) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }
  return String(fallback || "#000000").toUpperCase();
}

/* src/index.js */
registerCard();
