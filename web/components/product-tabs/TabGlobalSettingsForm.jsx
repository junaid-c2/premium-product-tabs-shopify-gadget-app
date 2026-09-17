import {
  DISPLAY_TYPE,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TAB_STYLE,
  createDefaultTabConfigsSettings,
  normalizeTabConfigsSettings,
} from "../../../api/utils/tabConfigsSettings.js";

/** @see https://shopify.dev/docs/api/app-home/latest/web-components/forms/color-field */
function ColorField({ label, value, onChange, disabled, allowTransparent = false }) {
  const displayValue = value && value !== "transparent" ? value : "";

  const handleChange = (next) => {
    if (!next && allowTransparent) {
      onChange("transparent");
      return;
    }
    if (next) onChange(next);
  };

  return (
    <s-color-field
      label={label}
      disabled={disabled}
      value={displayValue}
      alpha={allowTransparent}
      details={
        allowTransparent && value === "transparent"
          ? "Transparent — pick a color to replace"
          : undefined
      }
      onInput={(e) => handleChange(e.currentTarget.value)}
      onChange={(e) => handleChange(e.currentTarget.value)}
    />
  );
}

function NumberField({ label, value, min, max, onChange, disabled, suffix = "px" }) {
  return (
    <s-text-field
      label={label}
      suffix={suffix}
      disabled={disabled}
      value={String(value ?? "")}
      details={`${min}–${max}${suffix}`}
      onInput={(e) => {
        const raw = e.currentTarget.value.trim();
        if (raw === "") return;
        const n = Number(raw);
        if (Number.isNaN(n)) return;
        onChange(Math.min(max, Math.max(min, Math.round(n))));
      }}
    />
  );
}

function SettingsSectionBlock({ title, description, children, showDivider = true }) {
  return (
    <>
      {showDivider ? <s-divider /> : null}
      <div className="tab-global-settings__section">
        {title ? <h3 className="tab-global-settings__section-title">{title}</h3> : null}
        <s-stack gap="base">
          {description ? <s-text tone="subdued">{description}</s-text> : null}
          {children}
        </s-stack>
      </div>
    </>
  );
}

function TypographyFields({ labelPrefix, typography, onPatch, disabled }) {
  const fontFamilyValue = typography?.fontFamily ?? "inherit";
  const fontFamilyInList = FONT_FAMILY_OPTIONS.some((opt) => opt.value === fontFamilyValue);

  return (
    <s-stack gap="base">
      {labelPrefix ? (
        <s-text type="strong" tone="subdued">
          {labelPrefix}
        </s-text>
      ) : null}
      <s-grid gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap="base">
        <s-select
          label="Font family"
          disabled={disabled}
          value={fontFamilyValue}
          onChange={(e) => onPatch({ fontFamily: e.currentTarget.value })}
        >
          {FONT_FAMILY_OPTIONS.map((opt) => (
            <s-option key={opt.value} value={opt.value} selected={fontFamilyValue === opt.value}>
              {opt.label}
            </s-option>
          ))}
          {!fontFamilyInList && fontFamilyValue ? (
            <s-option value={fontFamilyValue} selected>
              Custom
            </s-option>
          ) : null}
        </s-select>
        <s-select
          label="Font weight"
          disabled={disabled}
          value={typography?.fontWeight ?? "400"}
          onChange={(e) => onPatch({ fontWeight: e.currentTarget.value })}
        >
          {FONT_WEIGHT_OPTIONS.map((opt) => (
            <s-option
              key={opt.value}
              value={opt.value}
              selected={typography?.fontWeight === opt.value}
            >
              {opt.label}
            </s-option>
          ))}
        </s-select>
        <s-select
          label="Text style"
          disabled={disabled}
          value={typography?.fontStyle ?? "normal"}
          onChange={(e) => onPatch({ fontStyle: e.currentTarget.value })}
        >
          {FONT_STYLE_OPTIONS.map((opt) => (
            <s-option
              key={opt.value}
              value={opt.value}
              selected={typography?.fontStyle === opt.value}
            >
              {opt.label}
            </s-option>
          ))}
        </s-select>
      </s-grid>
      <NumberField
        label="Font size"
        value={typography?.fontSize}
        min={10}
        max={32}
        disabled={disabled}
        onChange={(v) => onPatch({ fontSize: v })}
      />
    </s-stack>
  );
}

function ColorStateRow({ bgLabel, borderLabel, textLabel, colors, keys, onPatch, disabled }) {
  return (
    <s-grid gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap="base">
      <ColorField
        label={bgLabel ?? "Background color"}
        value={colors[keys.bg]}
        disabled={disabled}
        allowTransparent
        onChange={(v) => onPatch({ [keys.bg]: v })}
      />
      <ColorField
        label={borderLabel ?? "Border color"}
        value={colors[keys.border]}
        disabled={disabled}
        allowTransparent
        onChange={(v) => onPatch({ [keys.border]: v })}
      />
      <ColorField
        label={textLabel ?? "Text color"}
        value={colors[keys.text]}
        disabled={disabled}
        onChange={(v) => onPatch({ [keys.text]: v })}
      />
    </s-grid>
  );
}

export function TabGlobalSettingsForm({ settings, onChange, disabled }) {
  const s = normalizeTabConfigsSettings(settings ?? createDefaultTabConfigsSettings());
  const isTabs = s.displayType === DISPLAY_TYPE.TABS;
  const isAccordions = s.displayType === DISPLAY_TYPE.ACCORDIONS;
  const isUnderline = isTabs && s.tabStyle === TAB_STYLE.UNDERLINE;

  const patchSettings = (patch) => onChange({ ...s, ...patch });
  const patchColors = (patch) => onChange({ ...s, colors: { ...s.colors, ...patch } });
  const patchLayout = (patch) => onChange({ ...s, layout: { ...s.layout, ...patch } });
  const patchHeaderTypography = (patch) =>
    onChange({
      ...s,
      typography: { ...s.typography, header: { ...s.typography.header, ...patch } },
    });
  const patchBodyTypography = (patch) =>
    onChange({
      ...s,
      typography: { ...s, body: { ...s.typography.body, ...patch } },
    });

  return (
    <s-stack gap="large-100">
      <SettingsSectionBlock title="Layout" showDivider={false}>
        <s-choice-list
          label="Display type"
          name="displayType"
          disabled={disabled}
          onChange={(e) => {
            const value = e.currentTarget.values?.[0];
            if (value) patchSettings({ displayType: value });
          }}
        >
          <s-choice value={DISPLAY_TYPE.TABS} selected={s.displayType === DISPLAY_TYPE.TABS}>
            Tabs
          </s-choice>
          <s-choice
            value={DISPLAY_TYPE.ACCORDIONS}
            selected={s.displayType === DISPLAY_TYPE.ACCORDIONS}
          >
            Accordions
          </s-choice>
        </s-choice-list>
        {isTabs ? (
          <s-choice-list
            label="Tab style"
            name="tabStyle"
            disabled={disabled}
            onChange={(e) => {
              const value = e.currentTarget.values?.[0];
              if (value) patchSettings({ tabStyle: value });
            }}
          >
            <s-choice value={TAB_STYLE.UNDERLINE} selected={s.tabStyle === TAB_STYLE.UNDERLINE}>
              Bottom underline
            </s-choice>
            <s-choice value={TAB_STYLE.FILLED} selected={s.tabStyle === TAB_STYLE.FILLED}>
              Filled
            </s-choice>
          </s-choice-list>
        ) : null}
      </SettingsSectionBlock>

      <SettingsSectionBlock title="Default tab">
        <ColorStateRow
          colors={s.colors}
          disabled={disabled}
          keys={{ bg: "backgroundColor", border: "borderColor", text: "textColor" }}
          onPatch={patchColors}
        />
      </SettingsSectionBlock>

      <SettingsSectionBlock title="Hover">
        <ColorStateRow
          colors={s.colors}
          disabled={disabled}
          keys={{
            bg: "hoverBackgroundColor",
            border: "hoverBorderColor",
            text: "hoverTextColor",
          }}
          onPatch={patchColors}
        />
      </SettingsSectionBlock>

      <SettingsSectionBlock title="Active / selected">
        <ColorStateRow
          colors={s.colors}
          disabled={disabled}
          borderLabel={isUnderline ? "Underline color" : "Border color"}
          keys={{
            bg: "activeBackgroundColor",
            border: "activeBorderColor",
            text: "activeTextColor",
          }}
          onPatch={patchColors}
        />
      </SettingsSectionBlock>

      {isTabs ? (
        <SettingsSectionBlock title="Spacing">
          <NumberField
            label="Space between tab headers"
            value={s.layout.tabsHeaderGap}
            min={0}
            max={48}
            disabled={disabled}
            onChange={(v) => patchLayout({ tabsHeaderGap: v })}
          />
        </SettingsSectionBlock>
      ) : null}

      {isAccordions ? (
        <SettingsSectionBlock title="Spacing">
          <NumberField
            label="Space between accordion headers"
            value={s.layout.accordionsItemGap}
            min={0}
            max={48}
            disabled={disabled}
            onChange={(v) => patchLayout({ accordionsItemGap: v })}
          />
        </SettingsSectionBlock>
      ) : null}

      {isTabs ? (
        <>
          <SettingsSectionBlock
            title="Tab header border"
            description="Applies to filled tab style. Underline tabs use the Shape section."
          >
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <NumberField
                label="Border width"
                value={s.layout.tabsHeaderBorderWidth}
                min={0}
                max={8}
                disabled={disabled}
                onChange={(v) => patchLayout({ tabsHeaderBorderWidth: v })}
              />
              <NumberField
                label="Border radius"
                value={s.layout.tabsHeaderBorderRadius}
                min={0}
                max={32}
                disabled={disabled}
                onChange={(v) => patchLayout({ tabsHeaderBorderRadius: v })}
              />
            </s-grid>
            <ColorField
              label="Border color"
              value={s.colors.tabsHeaderBorderColor}
              disabled={disabled}
              allowTransparent
              onChange={(v) => patchColors({ tabsHeaderBorderColor: v })}
            />
          </SettingsSectionBlock>

          <SettingsSectionBlock
            title="Tabs container"
            description="Border and background wrap the whole tabs block (tab bar and content), not each tab panel."
          >
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <NumberField
                label="Border width"
                value={s.layout.tabsBodyBorderWidth}
                min={0}
                max={8}
                disabled={disabled}
                onChange={(v) => patchLayout({ tabsBodyBorderWidth: v })}
              />
              <NumberField
                label="Border radius"
                value={s.layout.tabsBodyBorderRadius}
                min={0}
                max={32}
                disabled={disabled}
                onChange={(v) => patchLayout({ tabsBodyBorderRadius: v })}
              />
            </s-grid>
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <ColorField
                label="Border color"
                value={s.colors.tabsBodyBorderColor}
                disabled={disabled}
                allowTransparent
                onChange={(v) => patchColors({ tabsBodyBorderColor: v })}
              />
              <ColorField
                label="Background color"
                value={s.colors.tabsBodyBackgroundColor}
                disabled={disabled}
                allowTransparent
                onChange={(v) => patchColors({ tabsBodyBackgroundColor: v })}
              />
            </s-grid>
            <NumberField
              label="Inner spacing"
              value={s.layout.tabsContainerPadding}
              min={0}
              max={48}
              disabled={disabled}
              onChange={(v) => patchLayout({ tabsContainerPadding: v })}
            />
          </SettingsSectionBlock>

          <SettingsSectionBlock title="Tab content">
            <NumberField
              label="Space below tab bar"
              value={s.layout.tabsHeaderBodyGap}
              min={0}
              max={48}
              disabled={disabled}
              onChange={(v) => patchLayout({ tabsHeaderBodyGap: v })}
            />
            <NumberField
              label="Inner padding"
              value={s.layout.tabsBodyPadding}
              min={0}
              max={48}
              disabled={disabled}
              onChange={(v) => patchLayout({ tabsBodyPadding: v })}
            />
          </SettingsSectionBlock>
        </>
      ) : null}

      {isAccordions ? (
        <>
          <SettingsSectionBlock title="Accordion header border">
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <NumberField
                label="Border width"
                value={s.layout.accordionsHeaderBorderWidth}
                min={0}
                max={8}
                disabled={disabled}
                onChange={(v) => patchLayout({ accordionsHeaderBorderWidth: v })}
              />
              <NumberField
                label="Border radius"
                value={s.layout.accordionsHeaderBorderRadius}
                min={0}
                max={32}
                disabled={disabled}
                onChange={(v) => patchLayout({ accordionsHeaderBorderRadius: v })}
              />
            </s-grid>
            <ColorField
              label="Border color"
              value={s.colors.accordionsHeaderBorderColor}
              disabled={disabled}
              allowTransparent
              onChange={(v) => patchColors({ accordionsHeaderBorderColor: v })}
            />
          </SettingsSectionBlock>

          <SettingsSectionBlock
            title="Accordions container"
            description="Border and background wrap the whole accordion block (all headers and content), not each section panel."
          >
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <NumberField
                label="Border width"
                value={s.layout.accordionsBodyBorderWidth}
                min={0}
                max={8}
                disabled={disabled}
                onChange={(v) => patchLayout({ accordionsBodyBorderWidth: v })}
              />
              <NumberField
                label="Border radius"
                value={s.layout.accordionsBodyBorderRadius}
                min={0}
                max={32}
                disabled={disabled}
                onChange={(v) => patchLayout({ accordionsBodyBorderRadius: v })}
              />
            </s-grid>
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <ColorField
                label="Border color"
                value={s.colors.accordionsBodyBorderColor}
                disabled={disabled}
                allowTransparent
                onChange={(v) => patchColors({ accordionsBodyBorderColor: v })}
              />
              <ColorField
                label="Background color"
                value={s.colors.accordionsBodyBackgroundColor}
                disabled={disabled}
                allowTransparent
                onChange={(v) => patchColors({ accordionsBodyBackgroundColor: v })}
              />
            </s-grid>
            <NumberField
              label="Inner spacing"
              value={s.layout.accordionsContainerPadding}
              min={0}
              max={48}
              disabled={disabled}
              onChange={(v) => patchLayout({ accordionsContainerPadding: v })}
            />
          </SettingsSectionBlock>

          <SettingsSectionBlock title="Accordion content">
            <NumberField
              label="Space below header"
              value={s.layout.accordionsHeaderBodyGap}
              min={0}
              max={48}
              disabled={disabled}
              onChange={(v) => patchLayout({ accordionsHeaderBodyGap: v })}
            />
            <NumberField
              label="Inner padding"
              value={s.layout.accordionsBodyPadding}
              min={0}
              max={48}
              disabled={disabled}
              onChange={(v) => patchLayout({ accordionsBodyPadding: v })}
            />
          </SettingsSectionBlock>
        </>
      ) : null}

      <SettingsSectionBlock title="Typography">
        <TypographyFields
          labelPrefix="Tab & accordion headers"
          typography={s.typography?.header}
          disabled={disabled}
          onPatch={patchHeaderTypography}
        />
        <TypographyFields
          labelPrefix="Tab body content"
          typography={s.typography?.body}
          disabled={disabled}
          onPatch={patchBodyTypography}
        />
      </SettingsSectionBlock>

      {isUnderline ? (
        <SettingsSectionBlock title="Shape">
          <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
            <NumberField
              label="Underline width"
              value={s.layout.underlineWidth}
              min={1}
              max={8}
              disabled={disabled}
              onChange={(v) => patchLayout({ underlineWidth: v })}
            />
            <ColorField
              label="Tab bar divider color"
              value={s.layout.tabBarDividerColor}
              disabled={disabled}
              onChange={(v) => patchLayout({ tabBarDividerColor: v })}
            />
          </s-grid>
        </SettingsSectionBlock>
      ) : null}
    </s-stack>
  );
}
