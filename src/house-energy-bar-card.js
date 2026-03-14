import { buildCardModel, collectRelevantEntities, computeEntitySignature } from "./house-energy-model.js";
import {
  CARD_ELEMENT_TAG,
  CARD_NAME,
  DEFAULT_CONFIG,
  SEGMENT_ENTITY_MAP,
  SEGMENT_IDS,
} from "./constants.js";
import { normalizeConfig, validateConfig } from "./validate.js";

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

export class HouseEnergyBarCard extends HTMLElement {
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

export function registerCard() {
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
