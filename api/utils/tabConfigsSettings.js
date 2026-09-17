/** Global storefront presentation settings (stored on `tabConfigs.settings`). */

export const DISPLAY_TYPE = {
  TABS: "tabs",
  ACCORDIONS: "accordions",
};

export const TAB_STYLE = {
  UNDERLINE: "underline",
  FILLED: "filled",
};

export const FONT_FAMILY_OPTIONS = [
  { label: "Theme default", value: "inherit" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

export const FONT_WEIGHT_OPTIONS = [
  { label: "Normal", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
];

export const FONT_STYLE_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Italic", value: "italic" },
];

/** @returns {{ fontFamily: string, fontWeight: string, fontStyle: string, fontSize: number }} */
export function createDefaultTypographyBlock(overrides = {}) {
  return {
    fontFamily: "inherit",
    fontWeight: "400",
    fontStyle: "normal",
    fontSize: 14,
    ...overrides,
  };
}

/** Default storefront styling applied on app install (`tabConfigs.settings`). */
export function createDefaultTabConfigsSettings() {
  return {
    displayType: DISPLAY_TYPE.TABS,
    tabStyle: TAB_STYLE.UNDERLINE,
    typography: {
      header: createDefaultTypographyBlock({ fontSize: 16, fontWeight: "500" }),
      body: createDefaultTypographyBlock({ fontSize: 14, fontWeight: "400" }),
    },
    layout: {
      borderRadius: 1,
      borderWidth: 1,
      underlineWidth: 2,
      tabBarDividerColor: "#E1E3E5",
      tabsHeaderGap: 0,
      accordionsItemGap: 0,
      tabsHeaderBorderWidth: 0,
      tabsHeaderBorderRadius: 0,
      accordionsHeaderBorderWidth: 0,
      accordionsHeaderBorderRadius: 0,
      tabsHeaderBodyGap: 0,
      tabsBodyBorderWidth: 1,
      tabsBodyBorderRadius: 0,
      tabsContainerPadding: 0,
      tabsBodyPadding: 16,
      accordionsHeaderBodyGap: 0,
      accordionsBodyBorderWidth: 1,
      accordionsBodyBorderRadius: 0,
      accordionsContainerPadding: 0,
      accordionsBodyPadding: 16,
    },
    colors: {
      textColor: "#6D7175",
      backgroundColor: "transparent",
      borderColor: "#EEEEEE",
      hoverTextColor: "#202223",
      hoverBackgroundColor: "#EEEEEE",
      hoverBorderColor: "#5C1E1E",
      activeTextColor: "#202223",
      activeBackgroundColor: "#EEEEEE",
      activeBorderColor: "#5C1E1E",
      tabsHeaderBorderColor: "#D9C9C9",
      accordionsHeaderBorderColor: "#EEEEEE",
      tabsBodyBorderColor: "#E1E3E5",
      tabsBodyBackgroundColor: "transparent",
      accordionsBodyBorderColor: "#EEEEEE",
      accordionsBodyBackgroundColor: "transparent",
    },
  };
}

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** @param {unknown} blockIn @param {{ fontFamily: string, fontWeight: string, fontStyle: string, fontSize: number }} defaults */
function normalizeTypographyBlock(blockIn, defaults) {
  const block =
    blockIn && typeof blockIn === "object"
      ? /** @type {Record<string, unknown>} */ (blockIn)
      : {};
  return {
    fontFamily:
      typeof block.fontFamily === "string" ? block.fontFamily : defaults.fontFamily,
    fontWeight:
      typeof block.fontWeight === "string" ? block.fontWeight : defaults.fontWeight,
    fontStyle: block.fontStyle === "italic" ? "italic" : defaults.fontStyle,
    fontSize: clampNumber(block.fontSize, defaults.fontSize, 10, 32),
  };
}

/** @param {unknown} typographyIn @param {{ header: ReturnType<typeof createDefaultTypographyBlock>, body: ReturnType<typeof createDefaultTypographyBlock> }} defaults */
function normalizeTypography(typographyIn, defaults) {
  const source =
    typographyIn && typeof typographyIn === "object"
      ? /** @type {Record<string, unknown>} */ (typographyIn)
      : {};

  const hasNested =
    source.header && typeof source.header === "object" && source.body && typeof source.body === "object";

  if (hasNested) {
    return {
      header: normalizeTypographyBlock(source.header, defaults.header),
      body: normalizeTypographyBlock(source.body, defaults.body),
    };
  }

  /** @type {Record<string, unknown>} */
  const legacy = source;
  const legacyBlock = normalizeTypographyBlock(legacy, defaults.header);
  return {
    header: legacyBlock,
    body: normalizeTypographyBlock(source.body, legacyBlock),
  };
}

function typographyBlockToCssVars(prefix, block) {
  return {
    [`--ppt-${prefix}-font-family`]:
      block.fontFamily === "inherit" ? "inherit" : block.fontFamily,
    [`--ppt-${prefix}-font-weight`]: block.fontWeight,
    [`--ppt-${prefix}-font-style`]: block.fontStyle,
    [`--ppt-${prefix}-font-size`]: `${block.fontSize}px`,
  };
}

function legacyBorderWidth(layoutIn, defaults) {
  return clampNumber(layoutIn.borderWidth, defaults.layout.borderWidth, 0, 8);
}

function legacyBorderRadius(layoutIn, defaults) {
  return clampNumber(layoutIn.borderRadius, defaults.layout.borderRadius, 0, 32);
}

/** @param {unknown} raw */
export function normalizeTabConfigsSettings(raw) {
  const defaults = createDefaultTabConfigsSettings();
  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const source = /** @type {Record<string, unknown>} */ (raw);
  const colorsIn = source.colors && typeof source.colors === "object" ? source.colors : {};
  const layoutIn = source.layout && typeof source.layout === "object" ? source.layout : {};
  const legacyWidth = legacyBorderWidth(layoutIn, defaults);
  const legacyRadius = legacyBorderRadius(layoutIn, defaults);
  const legacyBorderColor =
    typeof colorsIn.borderColor === "string" ? colorsIn.borderColor : defaults.colors.borderColor;

  return {
    displayType:
      source.displayType === DISPLAY_TYPE.ACCORDIONS
        ? DISPLAY_TYPE.ACCORDIONS
        : DISPLAY_TYPE.TABS,
    tabStyle:
      source.tabStyle === TAB_STYLE.FILLED ? TAB_STYLE.FILLED : TAB_STYLE.UNDERLINE,
    typography: normalizeTypography(source.typography, defaults.typography),
    layout: {
      borderRadius: legacyRadius,
      borderWidth: legacyWidth,
      underlineWidth: clampNumber(
        layoutIn.underlineWidth,
        defaults.layout.underlineWidth,
        1,
        8
      ),
      tabBarDividerColor:
        typeof layoutIn.tabBarDividerColor === "string"
          ? layoutIn.tabBarDividerColor
          : defaults.layout.tabBarDividerColor,
      tabsHeaderGap: clampNumber(
        layoutIn.tabsHeaderGap,
        defaults.layout.tabsHeaderGap,
        0,
        48
      ),
      accordionsItemGap: clampNumber(
        layoutIn.accordionsItemGap,
        defaults.layout.accordionsItemGap,
        0,
        48
      ),
      tabsHeaderBorderWidth: clampNumber(
        layoutIn.tabsHeaderBorderWidth,
        legacyWidth,
        0,
        8
      ),
      tabsHeaderBorderRadius: clampNumber(
        layoutIn.tabsHeaderBorderRadius,
        legacyRadius,
        0,
        32
      ),
      accordionsHeaderBorderWidth: clampNumber(
        layoutIn.accordionsHeaderBorderWidth,
        legacyWidth,
        0,
        8
      ),
      accordionsHeaderBorderRadius: clampNumber(
        layoutIn.accordionsHeaderBorderRadius,
        defaults.layout.accordionsHeaderBorderRadius,
        0,
        32
      ),
      tabsHeaderBodyGap: clampNumber(
        layoutIn.tabsHeaderBodyGap,
        defaults.layout.tabsHeaderBodyGap,
        0,
        48
      ),
      tabsBodyBorderWidth: clampNumber(
        layoutIn.tabsBodyBorderWidth,
        defaults.layout.tabsBodyBorderWidth,
        0,
        8
      ),
      tabsBodyBorderRadius: clampNumber(
        layoutIn.tabsBodyBorderRadius,
        defaults.layout.tabsBodyBorderRadius,
        0,
        32
      ),
      tabsContainerPadding: clampNumber(
        layoutIn.tabsContainerPadding,
        defaults.layout.tabsContainerPadding,
        0,
        48
      ),
      tabsBodyPadding: clampNumber(
        layoutIn.tabsBodyPadding,
        defaults.layout.tabsBodyPadding,
        0,
        48
      ),
      accordionsHeaderBodyGap: clampNumber(
        layoutIn.accordionsHeaderBodyGap,
        defaults.layout.accordionsHeaderBodyGap,
        0,
        48
      ),
      accordionsBodyBorderWidth: clampNumber(
        layoutIn.accordionsBodyBorderWidth,
        defaults.layout.accordionsBodyBorderWidth,
        0,
        8
      ),
      accordionsBodyBorderRadius: clampNumber(
        layoutIn.accordionsBodyBorderRadius,
        defaults.layout.accordionsBodyBorderRadius,
        0,
        32
      ),
      accordionsContainerPadding: clampNumber(
        layoutIn.accordionsContainerPadding,
        defaults.layout.accordionsContainerPadding,
        0,
        48
      ),
      accordionsBodyPadding: clampNumber(
        layoutIn.accordionsBodyPadding,
        defaults.layout.accordionsBodyPadding,
        0,
        48
      ),
    },
    colors: {
      ...defaults.colors,
      ...colorsIn,
      tabsHeaderBorderColor:
        typeof colorsIn.tabsHeaderBorderColor === "string"
          ? colorsIn.tabsHeaderBorderColor
          : legacyBorderColor,
      accordionsHeaderBorderColor:
        typeof colorsIn.accordionsHeaderBorderColor === "string"
          ? colorsIn.accordionsHeaderBorderColor
          : legacyBorderColor,
      tabsBodyBorderColor:
        typeof colorsIn.tabsBodyBorderColor === "string"
          ? colorsIn.tabsBodyBorderColor
          : defaults.colors.tabsBodyBorderColor,
      tabsBodyBackgroundColor:
        typeof colorsIn.tabsBodyBackgroundColor === "string"
          ? colorsIn.tabsBodyBackgroundColor
          : defaults.colors.tabsBodyBackgroundColor,
      accordionsBodyBorderColor:
        typeof colorsIn.accordionsBodyBorderColor === "string"
          ? colorsIn.accordionsBodyBorderColor
          : defaults.colors.accordionsBodyBorderColor,
      accordionsBodyBackgroundColor:
        typeof colorsIn.accordionsBodyBackgroundColor === "string"
          ? colorsIn.accordionsBodyBackgroundColor
          : defaults.colors.accordionsBodyBackgroundColor,
    },
  };
}

/** CSS custom properties for the storefront preview. */
export function tabConfigsSettingsToCssVars(settings) {
  const s = normalizeTabConfigsSettings(settings);
  const c = s.colors;
  const h = s.typography.header;
  const b = s.typography.body;
  const l = s.layout;

  return {
    "--ppt-tab-text": c.textColor,
    "--ppt-tab-bg": c.backgroundColor,
    "--ppt-tab-border": c.borderColor,
    "--ppt-tab-hover-text": c.hoverTextColor,
    "--ppt-tab-hover-bg": c.hoverBackgroundColor,
    "--ppt-tab-hover-border": c.hoverBorderColor,
    "--ppt-tab-active-text": c.activeTextColor,
    "--ppt-tab-active-bg": c.activeBackgroundColor,
    "--ppt-tab-active-border": c.activeBorderColor,
    ...typographyBlockToCssVars("header", h),
    ...typographyBlockToCssVars("body", b),
    "--ppt-tab-radius": `${l.borderRadius}px`,
    "--ppt-tab-border-width": `${l.borderWidth}px`,
    "--ppt-tab-underline-width": `${l.underlineWidth}px`,
    "--ppt-tab-bar-divider": l.tabBarDividerColor,
    "--ppt-tabs-header-gap": `${l.tabsHeaderGap}px`,
    "--ppt-accordions-item-gap": `${l.accordionsItemGap}px`,
    "--ppt-tabs-header-border-width": `${l.tabsHeaderBorderWidth}px`,
    "--ppt-tabs-header-border-radius": `${l.tabsHeaderBorderRadius}px`,
    "--ppt-tabs-header-border": c.tabsHeaderBorderColor,
    "--ppt-accordions-header-border-width": `${l.accordionsHeaderBorderWidth}px`,
    "--ppt-accordions-header-border-radius": `${l.accordionsHeaderBorderRadius}px`,
    "--ppt-accordions-header-border": c.accordionsHeaderBorderColor,
    "--ppt-tabs-header-body-gap": `${l.tabsHeaderBodyGap}px`,
    "--ppt-tabs-body-border-width": `${l.tabsBodyBorderWidth}px`,
    "--ppt-tabs-body-border-radius": `${l.tabsBodyBorderRadius}px`,
    "--ppt-tabs-container-padding": `${l.tabsContainerPadding}px`,
    "--ppt-tabs-body-padding": `${l.tabsBodyPadding}px`,
    "--ppt-tabs-body-border": c.tabsBodyBorderColor,
    "--ppt-tabs-body-bg": c.tabsBodyBackgroundColor,
    "--ppt-accordions-header-body-gap": `${l.accordionsHeaderBodyGap}px`,
    "--ppt-accordions-body-border-width": `${l.accordionsBodyBorderWidth}px`,
    "--ppt-accordions-body-border-radius": `${l.accordionsBodyBorderRadius}px`,
    "--ppt-accordions-container-padding": `${l.accordionsContainerPadding}px`,
    "--ppt-accordions-body-padding": `${l.accordionsBodyPadding}px`,
    "--ppt-accordions-body-border": c.accordionsBodyBorderColor,
    "--ppt-accordions-body-bg": c.accordionsBodyBackgroundColor,
  };
}

/**
 * Admin preview frame: CSS variables for descendants plus explicit container chrome
 * (some Polaris/shadow roots do not resolve custom properties on shorthand `border`).
 */
export function tabConfigsPreviewFrameStyle(settings) {
  const cssVars = tabConfigsSettingsToCssVars(settings);
  const s = normalizeTabConfigsSettings(settings);
  const l = s.layout;
  const c = s.colors;

  const base = {
    ...cssVars,
    boxSizing: "border-box",
  };

  if (s.displayType === DISPLAY_TYPE.ACCORDIONS) {
    return {
      ...base,
      borderWidth: l.accordionsBodyBorderWidth,
      borderStyle: "solid",
      borderColor: c.accordionsBodyBorderColor,
      borderRadius: l.accordionsBodyBorderRadius,
      background:
        c.accordionsBodyBackgroundColor === "transparent"
          ? "#ffffff"
          : c.accordionsBodyBackgroundColor,
      padding: l.accordionsContainerPadding,
    };
  }

  return {
    ...base,
    borderWidth: l.tabsBodyBorderWidth,
    borderStyle: "solid",
    borderColor: c.tabsBodyBorderColor,
    borderRadius: l.tabsBodyBorderRadius,
    background:
      c.tabsBodyBackgroundColor === "transparent" ? "#ffffff" : c.tabsBodyBackgroundColor,
    padding: l.tabsContainerPadding,
  };
}
