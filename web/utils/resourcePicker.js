const RESOURCE_PICKER_TYPE = {
  products: "product",
  collections: "collection",
};

const GID_PREFIX = {
  product: "gid://shopify/Product/",
  collection: "gid://shopify/Collection/",
};

function toShopifyGid(resourceKind, id) {
  if (id == null || id === "") return null;
  const value = String(id);
  if (value.startsWith("gid://")) return value;
  const prefix = GID_PREFIX[RESOURCE_PICKER_TYPE[resourceKind] ?? resourceKind];
  if (!prefix) return null;
  return `${prefix}${value}`;
}

function normalizePickerItem(item) {
  const rawId = item?.id;
  const id =
    typeof rawId === "string" && rawId.includes("/")
      ? rawId.split("/").pop()
      : String(rawId ?? "");

  return {
    id,
    title: item?.title ?? item?.handle ?? "Untitled",
  };
}

/**
 * Open Shopify Admin resource picker (embedded app only).
 * @param {"products" | "collections"} resourceKind
 * @param {Array<{ id: string, title?: string }>} existing
 * @returns {Promise<Array<{ id: string, title: string }> | null>} null if cancelled
 */
export async function pickShopifyResources(resourceKind, existing = []) {
  if (typeof shopify === "undefined" || typeof shopify.resourcePicker !== "function") {
    throw new Error("Resource picker is only available inside the Shopify admin");
  }

  const pickerType = RESOURCE_PICKER_TYPE[resourceKind];
  if (!pickerType) {
    throw new Error(`Unknown resource kind: ${resourceKind}`);
  }

  const selectionIds = existing
    .map((item) => toShopifyGid(resourceKind, item.id))
    .filter(Boolean)
    .map((id) => ({ id }));

  const selected = await shopify.resourcePicker({
    type: pickerType,
    action: "select",
    multiple: true,
    filter: {
      archived: false,
      ...(pickerType === "product" ? { draft: false } : {}),
    },
    selectionIds,
  });

  if (!selected?.length) {
    return null;
  }

  return selected.map(normalizePickerItem).filter((item) => item.id);
}
