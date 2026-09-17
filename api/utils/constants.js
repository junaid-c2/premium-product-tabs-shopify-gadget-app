/** Tab enums and labels aligned with the Gadget `tab` model schema. */

export const CONTENT_TYPE = {
  STATIC: "static",
  DYNAMIC: "dynamic",
};

export const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPE.STATIC]: "Static text",
  [CONTENT_TYPE.DYNAMIC]: "Dynamic",
};

export const TARGETING = {
  ALL: "all",
  PRODUCTS: "products",
  COLLECTIONS: "collections",
};

/** Maps UI targeting → Gadget `appliesTo` enum */
export const TARGETING_TO_APPLIES_TO = {
  [TARGETING.ALL]: "all",
  [TARGETING.PRODUCTS]: "specific_products",
  [TARGETING.COLLECTIONS]: "specific_collections",
};

export const STATUS = {
  ACTIVE: "active",
  HIDDEN: "hidden",
};

/** Maps UI status → Gadget `status` enum */
export const STATUS_TO_MODEL = {
  [STATUS.ACTIVE]: "ACTIVE",
  [STATUS.HIDDEN]: "DISABLE",
};

export const EMPTY_BEHAVIOR = {
  HIDE: "hide",
  FALLBACK: "fallback",
};

export const STANDARD_FIELDS = [
  { label: "Description", value: "description" },
  { label: "Product Type", value: "product_type" },
  { label: "Vendor", value: "vendor" },
  { label: "Tags", value: "tags" },
  { label: "SKU", value: "sku" },
];

/**
 * Shopify `MetafieldDefinition.type.name` values allowed for dynamic tab data sources.
 * Text family (incl. rich text, choice lists, email-as-single-line), numbers, boolean.
 */
export const ALLOWED_DYNAMIC_METAFIELD_DEFINITION_TYPES = new Set([
  "single_line_text_field",
  "multi_line_text_field",
  "rich_text_field",
  "list.single_line_text_field",
  "number_integer",
  "number_decimal",
  "number",
  "boolean",
]);

/** @param {string | null | undefined} typeName */
export function isAllowedDynamicMetafieldDefinitionType(typeName) {
  if (!typeName || typeof typeName !== "string") return false;
  return ALLOWED_DYNAMIC_METAFIELD_DEFINITION_TYPES.has(typeName);
}

/** Metafield options are loaded via global action `fetchProductMetafieldDefinitions`. */
export const DATA_SOURCE_SELECT_OPTIONS = [
  { title: "Standard Fields", options: STANDARD_FIELDS },
  { title: "Product metafields", options: [] },
];

/**
 * App-data metafield on AppInstallation — read in theme app extensions as
 * `app.metafields.premium_product_tabs.storefront` (see snippets/premium-product-tabs-data.liquid).
 */
export const STOREFRONT_APP_METAFIELD = {
  namespace: "premium_product_tabs",
  key: "storefront",
  type: "json",
};
