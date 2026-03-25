import { buildCardModel, collectRelevantEntities } from "./house-energy-model.js";
import {
  emitConfigChanged,
  flushConfigCleanup,
  queueConfigCleanup,
  runConfigCleanup,
} from "./_shared/config-cleanup.js";
import {
  blendHex,
  buildSegmentBackground,
  normalizeHexColor,
  pickBestTextColor,
} from "./_shared/color.js";
import {
  getColorPresetOptions,
  normalizeColorPresetName,
} from "./_shared/color-presets.js";
import {
  buildColorOverrideEditorState,
  hasColorOverrides,
  normalizeTrackBlendOverrideValue,
  pickMappedStringValues,
  registerCustomCardMetadata,
  resolveEditorBackgroundColor,
  syncEditorFormsHass,
} from "./_shared/editor.js";
import { openMoreInfo } from "./_shared/interaction.js";
import { clamp } from "./_shared/math.js";
import { computeEntitySignature } from "./_shared/signature.js";
import {
  CARD_ELEMENT_TAG,
  CARD_NAME,
  CARD_TYPE,
  DEFAULT_CONFIG,
  PV_SEGMENT_ID,
  REQUIRED_ENTITY_KEYS,
  SEGMENT_ENTITY_MAP,
  SEGMENT_LABELS,
  SEGMENT_COLOR_TOKENS,
  SEGMENT_IDS,
} from "./constants.js";
import {
  HOUSE_CONFIG_CLEANUP_STEPS,
  HOUSE_EDITOR_CLEANUP_STEPS,
} from "./migrations.js";
import { normalizeConfig, validateConfig } from "./validate.js";
import {
  buildBackgroundColorField,
  buildColorTextSelector,
  buildSliderNumberSelector,
  EDITOR_SCHEMA_RANGE_BAR_HEIGHT,
  EDITOR_SCHEMA_RANGE_CORNER_RADIUS,
  EDITOR_SCHEMA_RANGE_TRACK_BLEND,
} from "./_shared/editor-schema.js";
import {
  buildCardPreviewMarkup,
  buildCardPreviewStyles,
  hasRequiredEntityValues,
  syncCardPreviewVisibility,
} from "./_shared/preview.js";
import {
  applyEditorIncomingConfig,
  commitEditorRawConfig,
  createEditorCleanupState,
  ensureSingleFormEditor,
  renderSingleFormEditor,
} from "./_shared/editor-controller.js";
import {
  applyMetricButtonState,
  buildMetricButtonMarkup,
  syncMetricButtonRowVisibility,
} from "./_shared/metric-button.js";

const FIXED_LINE_GAP_PX = 3;
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "house-energy-bar-editor";
const CARD_DESCRIPTION = "House Energy Bar: compact home energy overview for Home Assistant.";
const HOUSE_COLOR_FIELD_MAP = {
  track: ["track"],
  text_light: ["text_light", "text"],
  text_dark: ["text_dark", "text"],
  divider: ["divider"],
  energy_source: ["energy_source"],
  energy_storage_supply: ["energy_storage_supply"],
  grid_import: ["grid_import"],
  grid_export: ["grid_export"],
};
const SEGMENT_DEFS = SEGMENT_IDS.map((segmentId, index) => ({
  id: segmentId,
  number: index + 1,
  label: SEGMENT_LABELS[segmentId] || `Segment ${index + 1}`,
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
    this._showPreviewPlaceholder = false;
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
      if (!this._showPreviewPlaceholder) {
        this._renderModel();
      }
    }
  }

  disconnectedCallback() {
    if (this._refs?.shell) {
      this._refs.shell.removeEventListener("click", this._onClick);
    }
  }

  setConfig(config) {
    const cleanup = runConfigCleanup(config, HOUSE_CONFIG_CLEANUP_STEPS);
    const incomingType = cleanup.config?.type || config?.type || CARD_TYPE;
    if (incomingType !== CARD_TYPE) {
      throw new Error(`Card type must be '${CARD_TYPE}'.`);
    }
    const normalized = normalizeConfig(cleanup.config);
    const hasRequiredEntities = hasRequiredEntityValues(normalized.entities, REQUIRED_ENTITY_KEYS);
    if (hasRequiredEntities) {
      validateConfig(normalized);
    }
    this._config = normalized;
    this._lastSignature = "";

    this._ensureRendered();
    this._syncPreviewPlaceholder(!hasRequiredEntities);
    this._applyTheme();
    if (!this._showPreviewPlaceholder) {
      this._renderModel();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }
    if (this._showPreviewPlaceholder) {
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
          ${buildCardPreviewMarkup(CARD_DESCRIPTION)}
          <div class="card-content">
            ${SEGMENT_DEFS.map((segment) => buildSegmentSectionMarkup(segment)).join("")}
          </div>
        </div>
      </ha-card>
      ${styles()}
    `;

    this._refs = {
      shell: this.shadowRoot.querySelector(".shell"),
      previewPlaceholder: this.shadowRoot.querySelector(".card-preview-placeholder"),
      content: this.shadowRoot.querySelector(".card-content"),
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

  _syncPreviewPlaceholder(showPlaceholder) {
    this._showPreviewPlaceholder = showPlaceholder === true;
    syncCardPreviewVisibility(
      this._refs?.previewPlaceholder,
      [this._refs?.content],
      this._showPreviewPlaceholder,
    );
  }

  _renderModel() {
    const config = this._config || normalizeConfig(HouseEnergyBarCard.getStubConfig());
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

      applyMetricButtonState(this._hass, segmentRefs.primary, segmentModel.primary, buildMetricOptions(true));
      segmentRefs.secondaries.forEach((secondaryRef, index) => {
        applyMetricButtonState(this._hass, secondaryRef, segmentModel.chips[index], buildMetricOptions(false, true));
      });
      syncMetricButtonRowVisibility(segmentRefs.chipRow, ...segmentRefs.secondaries);
    });

    this._applySectionBackgrounds(config.colors, config.track_blend, config.fade_between_segments, visibleSegments);
  }

  _applyTheme() {
    const config = this._config || normalizeConfig(HouseEnergyBarCard.getStubConfig());
    const colors = config.colors;
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
    const trackColor = normalizeHexColor(colors.track, "#000000");
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
    this._cleanupState = createEditorCleanupState();
    this._onFormValueChanged = (event) => this._handleFormValueChanged(event);
  }

  setConfig(config) {
    const cleanup = applyEditorIncomingConfig(
      this,
      config,
      HOUSE_EDITOR_CLEANUP_STEPS,
      CARD_TYPE,
      normalizeColorPresetName,
      normalizeConfig,
    );
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
    this._form = ensureSingleFormEditor(this, this._onFormValueChanged);
    if (!this._form) {
      return;
    }
    renderSingleFormEditor(
      this,
      () => normalizeConfig(HouseEnergyBarCard.getStubConfig()),
      (_config, rawConfig) => buildEditorFormSchema(rawConfig),
      buildHouseEditorFormData,
    );
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
        ...pickMappedStringValues(this._config?.colors, HOUSE_COLOR_FIELD_MAP),
        ...(hadOverrides ? pickMappedStringValues(value.colors, HOUSE_COLOR_FIELD_MAP) : {}),
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

    commitEditorRawConfig(this, nextRaw, normalizeConfig);
    this._render();
    emitConfigChanged(this, this._rawConfig);
  }
}

function buildSegmentSectionMarkup(segment) {
  return `
    <section class="section section--segment" aria-label="${segment.label}" data-segment="${segment.id}">
      <div class="primary-row">
        ${buildMetricButtonMarkup(`${segment.id}-primary`, true)}
      </div>
      <div class="chip-row chip-row--segment">
        ${buildMetricButtonMarkup(`${segment.id}-secondary-1`, false)}
        ${buildMetricButtonMarkup(`${segment.id}-secondary-2`, false)}
      </div>
    </section>
  `;
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
        display: block;
      }

      ${buildCardPreviewStyles("--bb-bar-height")}

      .card-content {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: var(--bb-columns);
        align-items: stretch;
        grid-column: 1 / -1;
        height: var(--bb-bar-height);
        background: var(--bb-track-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        border-radius: var(--bb-radius);
        overflow: hidden;
      }

      .card-content[hidden] {
        display: none !important;
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

export function registerCard() {
  if (!customElements.get(CARD_ELEMENT_TAG)) {
    customElements.define(CARD_ELEMENT_TAG, HouseEnergyBarCard);
  }

  registerCustomCardMetadata(
    CARD_ELEMENT_TAG,
    CARD_NAME,
    CARD_DESCRIPTION,
  );
}

function buildMetricOptions(settleOnChange = false, hideWhenUnavailable = false) {
  return {
    defaultAriaLabel: "Energy metric",
    hideWhenUnavailable,
    settleOnChange,
    settleDurationMs: PRIMARY_SETTLE_DURATION_MS,
    settleEasing: COLOR_EASING,
  };
}

function buildTopFormSchema() {
  return [
    {
      type: "expandable",
      title: "Layout & Motion",
      schema: [
        {
          name: "bar_height",
          label: "Bar height (px)",
          required: true,
          selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_BAR_HEIGHT),
        },
        {
          name: "corner_radius",
          label: "Corner radius (px)",
          required: true,
          selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_CORNER_RADIUS),
        },
        {
          type: "grid",
          name: "colors",
          schema: [buildBackgroundColorField()],
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
  return [
    { name: "track", label: "Base track color", required: false, selector: buildColorTextSelector() },
    { name: "text_light", label: "Light text and icon color", required: false, selector: buildColorTextSelector() },
    { name: "text_dark", label: "Dark text and icon color", required: false, selector: buildColorTextSelector() },
    { name: "divider", label: "Divider line color", required: false, selector: buildColorTextSelector() },
    { name: "energy_source", label: "PV color", required: false, selector: buildColorTextSelector() },
    { name: "energy_storage_supply", label: "Battery output color", required: false, selector: buildColorTextSelector() },
    { name: "grid_import", label: "Grid import color", required: false, selector: buildColorTextSelector() },
    { name: "grid_export", label: "Grid export color", required: false, selector: buildColorTextSelector() },
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
      selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_TRACK_BLEND),
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
    ...buildColorOverrideEditorState(config, rawConfig, HOUSE_COLOR_FIELD_MAP, DEFAULT_CONFIG.colors.background),
  };
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
