import {
  CONTENT_TYPE,
  EMPTY_BEHAVIOR,
  STATUS,
  STATUS_TO_MODEL,
  TARGETING,
  TARGETING_TO_APPLIES_TO,
} from "../../api/utils/constants.js";
const APPLIES_TO_TO_TARGETING = {
  all: TARGETING.ALL,
  specific_products: TARGETING.PRODUCTS,
  specific_collections: TARGETING.COLLECTIONS,
};

export const NEW_TAB_UID = "new";

/** Matches api/utils/helper.js — used when saving new tabs. */
export function createShortUID() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const timestamp = Date.now().toString(36).padStart(8, "0");
  let randomPart = "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 4; i++) {
      randomPart += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 4; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `${timestamp}${randomPart}`;
}

export function createEmptyContent() {
  return {
    staticContent: "",
    dataSource: "description",
    template: "Material: {{value}}",
    emptyBehavior: EMPTY_BEHAVIOR.HIDE,
    fallbackText: "",
  };
}

export function createEmptyTab() {
  return {
    id: null,
    uid: null,
    title: "",
    contentType: CONTENT_TYPE.STATIC,
    content: createEmptyContent(),
    targeting: TARGETING.ALL,
    selectedProducts: [],
    selectedCollections: [],
    status: STATUS.ACTIVE,
    position: 0,
  };
}

/** Editor form content (nested) with legacy flat-field fallback. */
export function getFormContent(tab) {
  if (tab?.content && typeof tab.content === "object") {
    return { ...createEmptyContent(), ...tab.content };
  }
  return {
    staticContent: tab?.staticContent ?? "",
    dataSource: tab?.dataSource ?? "description",
    template: tab?.template ?? "Material: {{value}}",
    emptyBehavior: tab?.emptyBehavior ?? EMPTY_BEHAVIOR.HIDE,
    fallbackText: tab?.fallbackText ?? "",
  };
}

/** Keep only `{ id, title }` for stored product/collection targeting refs. */
export function normalizeResourceRefs(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (item == null || item.id == null || item.id === "") return null;
      const id = typeof item.id === "string" && item.id.includes("/")
        ? item.id.split("/").pop()
        : String(item.id);
      const title = item.title?.trim?.() || item.title || "Untitled";
      return { id, title };
    })
    .filter(Boolean);
}

/** Legacy: `targetIds` was an object with content + products/collections keys. */
function legacyTargetIdsObject(raw) {
  if (raw == null || Array.isArray(raw)) return {};
  return typeof raw === "object" ? raw : {};
}

/** Content section fields — stored on JSON field `content`, not `targetIds`. */
export function readTabContentConfig(record) {
  const fromField = record.content ?? record.contentConfig ?? {};
  const legacy = legacyTargetIdsObject(record.targetIds);
  return {
    staticContent: fromField.staticContent ?? legacy.staticContent ?? "",
    dataSource: fromField.dataSource ?? legacy.dataSource ?? "description",
    template: fromField.template ?? legacy.template ?? "Material: {{value}}",
    emptyBehavior: fromField.emptyBehavior ?? legacy.emptyBehavior ?? EMPTY_BEHAVIOR.HIDE,
    fallbackText: fromField.fallbackText ?? legacy.fallbackText ?? "",
  };
}

/**
 * Read product/collection refs from a tab record.
 * DB format: `targetIds` is `[{ id, title }, …]` (empty array when targeting all).
 */
export function getTargetingRefsFromApiTab(tab) {
  const raw = tab?.targetIds;
  const appliesTo = tab?.appliesTo;

  if (Array.isArray(raw)) {
    const refs = normalizeResourceRefs(raw);
    if (appliesTo === "specific_products") {
      return { products: refs, collections: [] };
    }
    if (appliesTo === "specific_collections") {
      return { products: [], collections: refs };
    }
    return { products: [], collections: [] };
  }

  const legacy = legacyTargetIdsObject(raw);
  return {
    products: normalizeResourceRefs(legacy.products),
    collections: normalizeResourceRefs(legacy.collections),
  };
}

/** Save only `[{ id, title }, …]` into JSON field `targetIds`. */
export function buildTargetIdsForSave(form) {
  if (form.targeting === TARGETING.PRODUCTS) {
    return normalizeResourceRefs(form.selectedProducts);
  }
  if (form.targeting === TARGETING.COLLECTIONS) {
    return normalizeResourceRefs(form.selectedCollections);
  }
  return [];
}

export function buildContentForSave(form) {
  const c = getFormContent(form);
  return {
    staticContent: c.staticContent ?? "",
    dataSource: c.dataSource ?? "description",
    template: c.template ?? "Material: {{value}}",
    emptyBehavior: c.emptyBehavior ?? EMPTY_BEHAVIOR.HIDE,
    fallbackText: c.fallbackText ?? "",
  };
}

export function recordToForm(record) {
  const { products, collections } = getTargetingRefsFromApiTab(record);
  return {
    id: record.id,
    uid: record.uid,
    title: record.title ?? "",
    contentType:
      record.contentType === "DYNAMIC" ? CONTENT_TYPE.DYNAMIC : CONTENT_TYPE.STATIC,
    content: { ...createEmptyContent(), ...readTabContentConfig(record) },
    targeting: APPLIES_TO_TO_TARGETING[record.appliesTo] ?? TARGETING.ALL,
    selectedProducts: products,
    selectedCollections: collections,
    status: record.status === "ACTIVE" ? STATUS.ACTIVE : STATUS.HIDDEN,
    position: record.position ?? 0,
  };
}

/** Gadget `tab`-shaped record for storefront preview from editor form state. */
export function formToPreviewApiTab(form) {
  const params = formToApiParams(form);
  return {
    id: form.id ?? "draft",
    uid: form.uid ?? NEW_TAB_UID,
    title: form.title?.trim() || "Untitled tab",
    contentType: params.contentType,
    appliesTo: params.appliesTo,
    status: params.status,
    position: form.position ?? 0,
    targetIds: params.targetIds,
    content: params.content,
  };
}

/** Merge in-progress editor tab into the shop tab list for preview. */
export function buildEditorPreviewTabs(allTabs, form, { isNew, uid }) {
  const draft = formToPreviewApiTab(form);
  if (isNew) {
    return [...(allTabs ?? []), draft].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
  }
  const list = allTabs ?? [];
  if (!list.some((t) => t.uid === uid)) {
    return [draft, ...list];
  }
  return list
    .map((t) => (t.uid === uid ? { ...t, ...draft, id: t.id, uid: t.uid } : t))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function formToApiParams(form) {
  return {
    title: form.title,
    appliesTo: TARGETING_TO_APPLIES_TO[form.targeting],
    contentType: form.contentType === CONTENT_TYPE.DYNAMIC ? "DYNAMIC" : "STATIC",
    status: STATUS_TO_MODEL[form.status],
    position: form.position ?? 0,
    targetIds: buildTargetIdsForSave(form),
    content: buildContentForSave(form),
  };
}

export function resolveTemplatePreview(template) {
  const value = "Example value";
  if (!template.includes("{{value}}")) {
    return template || value;
  }
  return template.replace(/\{\{value\}\}/g, value);
}

export function mergeUniqueResources(existing, incoming) {
  const seen = new Set(existing.map((item) => item.id));
  const additions = incoming.filter((item) => !seen.has(item.id));
  return [...existing, ...additions];
}

export function validateTab(tab) {
  const errors = [];

  if (!tab.title?.trim()) {
    errors.push("Title is required");
  }

  if (tab.targeting === TARGETING.PRODUCTS && tab.selectedProducts.length === 0) {
    errors.push("Select at least one product");
  }

  if (tab.targeting === TARGETING.COLLECTIONS && tab.selectedCollections.length === 0) {
    errors.push("Select at least one collection");
  }

  const content = getFormContent(tab);
  if (
    tab.contentType === CONTENT_TYPE.DYNAMIC &&
    content.emptyBehavior === EMPTY_BEHAVIOR.FALLBACK &&
    !content.fallbackText?.trim()
  ) {
    errors.push("Fallback text is required when showing fallback content");
  }

  return errors;
}

export function sortTabs(tabs) {
  return [...tabs].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function targetingSummary(tab) {
  if (tab.targeting === TARGETING.ALL) return "All Products";
  if (tab.targeting === TARGETING.PRODUCTS) {
    const n = tab.selectedProducts.length;
    return n === 0 ? "No products" : n === 1 ? "1 Product" : `${n} Products`;
  }
  if (tab.selectedCollections.length === 1) return tab.selectedCollections[0].title;
  return `${tab.selectedCollections.length} Collections`;
}

/** Targeting label from a Gadget `tab` record (list / preview). */
export function targetingSummaryFromApiTab(tab) {
  const { products, collections } = getTargetingRefsFromApiTab(tab);

  if (tab.appliesTo === "all") return "All Products";
  if (tab.appliesTo === "specific_products") {
    const n = products.length;
    return n === 0 ? "No products" : n === 1 ? "1 Product" : `${n} Products`;
  }
  if (tab.appliesTo === "specific_collections") {
    if (collections.length === 1) return collections[0]?.title ?? "1 Collection";
    return `${collections.length} Collections`;
  }
  return "All Products";
}

/** Move one item in a list; returns a new array. */
export function reorderList(items, fromIndex, toIndex) {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Keep `position` aligned with visual index after a local reorder. */
export function normalizeTabPositions(tabs) {
  return tabs.map((tab, index) =>
    tab.position === index ? tab : { ...tab, position: index }
  );
}

/** True when tab id sequence changed vs the server-sorted list. */
export function hasTabOrderChanged(before, after) {
  if (before.length !== after.length) return true;
  return after.some((tab, index) => before[index]?.id !== tab.id);
}

/** True when live server list matches an expected id order (e.g. after bulk reorder). */
export function serverTabOrderMatches(serverTabs, expectedIds) {
  if (!expectedIds?.length || serverTabs.length !== expectedIds.length) return false;
  return expectedIds.every((id, index) => serverTabs[index]?.id === id);
}

/**
 * Positions to persist after reorder (0..n-1). Empty if order matches `before`.
 */
export function buildTabPositionUpdates(before, after) {
  if (!hasTabOrderChanged(before, after)) return [];
  return after.map((tab, index) => ({ id: tab.id, position: index }));
}

/** Body text shown in storefront tab preview from API record. */
export function getApiTabPreviewContent(tab) {
  const config = readTabContentConfig(tab);
  if (tab.contentType === "DYNAMIC") {
    return resolveTemplatePreview(config.template ?? "Material: {{value}}");
  }
  const staticContent = config.staticContent?.trim();
  return staticContent || "No content yet.";
}
