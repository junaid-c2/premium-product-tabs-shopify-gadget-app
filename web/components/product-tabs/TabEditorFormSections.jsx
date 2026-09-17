import {
  CONTENT_TYPE,
  EMPTY_BEHAVIOR,
  TARGETING,
} from "../../../api/utils/constants.js";
import { buildDataSourceSelectOptions } from "../../utils/productMetafieldDefinitions.js";
import { getFormContent } from "../../utils/helper";
import { TabRichTextEditor } from "./TabRichTextEditor.jsx";

function EditorCard({ heading, children }) {
  return (
    <s-grid background="base" border="base" borderRadius="base" padding="base" gap="base">
      <s-heading>{heading}</s-heading>
      {children}
    </s-grid>
  );
}

function SelectedResourceChips({ items, kind, onRemove }) {
  if (!items.length) return null;

  const iconType = kind === "products" ? "product" : "collection";
  const kindLabel = kind === "products" ? "products" : "collections";

  return (
    <s-stack direction="inline" gap="base">
      {items.map((item) => (
        <s-clickable-chip
          key={item.id}
          color="base"
          removable
          accessibilityLabel={`Remove ${item.title} from selected ${kindLabel}`}
          onRemove={() => onRemove(item.id)}
        >
          <s-icon slot="graphic" type={iconType} />
          {item.title}
        </s-clickable-chip>
      ))}
    </s-stack>
  );
}

export function TabEditorDetailsCard({ tab, isNew, uid, titleError, onUpdateField }) {
  return (
    <EditorCard heading="Tab information">
      <s-text-field
        label="Tab title"
        value={tab.title}
        error={titleError}
        details="Customers see this label in the tab bar on product pages."
        onInput={(e) => onUpdateField("title", e.currentTarget.value)}
      />
    </EditorCard>
  );
}

const PLACEHOLDER_DATA_SOURCE_VALUES = new Set(["__loading__", "__error__", "__empty__"]);

export function TabEditorContentCard({
  tab,
  previewText,
  fallbackError,
  onUpdateField,
  dataSourceSelectOptions = buildDataSourceSelectOptions([], { loading: true }),
}) {
  const content = getFormContent(tab);

  return (
    <EditorCard heading="Content">
      <s-choice-list
        label="Content type"
        name="contentType"
        onChange={(e) => {
          const values = e.currentTarget.values;
          if (values?.[0]) onUpdateField("contentType", values[0]);
        }}
      >
        <s-choice value={CONTENT_TYPE.STATIC} selected={tab.contentType === CONTENT_TYPE.STATIC}>
          Static text
        </s-choice>
        <s-choice value={CONTENT_TYPE.DYNAMIC} selected={tab.contentType === CONTENT_TYPE.DYNAMIC}>
          Dynamic (from metafield)
        </s-choice>
      </s-choice-list>

      {tab.contentType === CONTENT_TYPE.STATIC ? (
        <TabRichTextEditor
          label="Content"
          value={content.staticContent}
          placeholder="Enter tab content..."
          onChange={(html) => onUpdateField("content.staticContent", html)}
        />
      ) : (
        <s-stack gap="base">
          <s-select
            label="Data source"
            value={content.dataSource}
            onChange={(e) => {
              const value = e.currentTarget.value;
              if (PLACEHOLDER_DATA_SOURCE_VALUES.has(value)) return;
              onUpdateField("content.dataSource", value);
            }}
          >
            {dataSourceSelectOptions.map((group) => (
              <s-option-group key={group.title} label={group.title}>
                {group.options.map((opt) => (
                  <s-option
                    key={opt.value}
                    value={opt.value}
                    selected={content.dataSource === opt.value}
                  >
                    {opt.label}
                  </s-option>
                ))}
              </s-option-group>
            ))}
          </s-select>
          <s-text-field
            label="Template"
            value={content.template}
            placeholder="e.g. Material: {{value}}"
            details="Use {{value}} for the metafield value."
            onInput={(e) => onUpdateField("content.template", e.currentTarget.value)}
          />
          {/* <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack gap="small-200">
              <s-text tone="subdued">Template preview</s-text>
              <s-text>{previewText}</s-text>
            </s-stack>
          </s-box> */}
          <s-choice-list
            label="If value is empty"
            name="emptyBehavior"
            onChange={(e) => {
              const values = e.currentTarget.values;
              if (values?.[0]) onUpdateField("content.emptyBehavior", values[0]);
            }}
          >
            <s-choice
              value={EMPTY_BEHAVIOR.HIDE}
              selected={content.emptyBehavior === EMPTY_BEHAVIOR.HIDE}
            >
              Hide this tab
            </s-choice>
            <s-choice
              value={EMPTY_BEHAVIOR.FALLBACK}
              selected={content.emptyBehavior === EMPTY_BEHAVIOR.FALLBACK}
            >
              Show fallback text
            </s-choice>
          </s-choice-list>
          {content.emptyBehavior === EMPTY_BEHAVIOR.FALLBACK ? (
            <s-text-area
              label="Fallback text"
              rows={6}
              value={content?.fallbackText}
              placeholder="Enter fallback text..."
              details="This text will be displayed if the selected data source value is empty."
              error={fallbackError}
              onInput={(e) => onUpdateField("content.fallbackText", e?.currentTarget?.value)}
            />
          ) : null}
        </s-stack>
      )}
    </EditorCard>
  );
}

export function TabEditorTargetingCard({
  tab,
  targetingError,
  onUpdateTargeting,
  onPickResources,
  onRemoveProduct,
  onRemoveCollection,
}) {
  return (
    <EditorCard heading="Targeting">
      <s-choice-list
        label="Show on"
        name="targeting"
        details="Choose which product pages display this tab."
        onChange={(e) => {
          const values = e.currentTarget.values;
          if (values?.[0]) onUpdateTargeting(values[0]);
        }}
      >
        <s-choice value={TARGETING.ALL} selected={tab.targeting === TARGETING.ALL}>
          All products
        </s-choice>
        <s-choice value={TARGETING.PRODUCTS} selected={tab.targeting === TARGETING.PRODUCTS}>
          Specific products
        </s-choice>
        <s-choice value={TARGETING.COLLECTIONS} selected={tab.targeting === TARGETING.COLLECTIONS}>
          Specific collections
        </s-choice>
      </s-choice-list>

      {tab.targeting === TARGETING.PRODUCTS ? (
        <s-stack gap="small">
          <s-button variant="secondary" onClick={() => onPickResources("products")}>
            Select products
          </s-button>
          {targetingError ? <s-text tone="critical">{targetingError}</s-text> : null}
          {tab.selectedProducts.length ? (
            <SelectedResourceChips
              items={tab.selectedProducts}
              kind="products"
              onRemove={onRemoveProduct}
            />
          ) : (
            <s-text tone="subdued">No products selected yet</s-text>
          )}
        </s-stack>
      ) : null}

      {tab.targeting === TARGETING.COLLECTIONS ? (
        <s-stack gap="small">
          <s-button variant="secondary" onClick={() => onPickResources("collections")}>
            Select collections
          </s-button>
          {targetingError ? <s-text tone="critical">{targetingError}</s-text> : null}
          {tab.selectedCollections.length ? (
            <SelectedResourceChips
              items={tab.selectedCollections}
              kind="collections"
              onRemove={onRemoveCollection}
            />
          ) : (
            <s-text tone="subdued">No collections selected yet</s-text>
          )}
        </s-stack>
      ) : null}
    </EditorCard>
  );
}
