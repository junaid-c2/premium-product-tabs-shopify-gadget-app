import { STANDARD_FIELDS } from "../../api/utils/constants.js";

export const PRODUCT_METAFIELDS_GROUP_TITLE = "Product metafields";

export function buildDataSourceSelectOptions(metafieldOptions = [], state = {}) {
  const { loading = false, loadError = false } = state;

  let metafieldGroupOptions = metafieldOptions;
  if (loading) {
    metafieldGroupOptions = [{ label: "Loading product metafields…", value: "__loading__" }];
  } else if (loadError) {
    metafieldGroupOptions = [
      { label: "Could not load metafields — try refreshing", value: "__error__" },
    ];
  } else if (!metafieldGroupOptions.length) {
    metafieldGroupOptions = [
      {
        label: "No text, number, or boolean product metafields found",
        value: "__empty__",
      },
    ];
  }

  return [
    { title: "Standard Fields", options: STANDARD_FIELDS },
    { title: PRODUCT_METAFIELDS_GROUP_TITLE, options: metafieldGroupOptions },
  ];
}

/** Uses `fetchProductMetafieldDefinitions` (Shopify calls go through `writeToShopify`). */
export function loadProductMetafieldDefinitions(apiClient) {
  return apiClient.fetchProductMetafieldDefinitions();
}
