import { STOREFRONT_APP_METAFIELD } from "./constants.js";
import { ensureShopTabConfigs } from "./ensureShopTabConfigs.js";
import { resolveIsPlanSubscribed } from "./isPlanSubscribed.js";
import {
  createDefaultTabConfigsSettings,
  normalizeTabConfigsSettings,
} from "./tabConfigsSettings.js";

const { namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY, type: metafieldType } =
  STOREFRONT_APP_METAFIELD;

const METAFIELDS_SET_MUTATION = `mutation ($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      id
      namespace
      key
      type
      value
      jsonValue
    }
    userErrors { field message code }
  }
}`;

async function shopifyGraphql({ api, shopId, mutation, variables }) {
  const result = await api.writeToShopify({
    shopId: String(shopId),
    mutation,
    variables: variables ?? {},
  });
  return result?.data ?? result;
}

function throwIfShopifyErrors(userErrors, step) {
  if (!userErrors?.length) return;
  throw new Error(`${step}: ${userErrors.map((e) => e.message).join("; ")}`);
}

function toAppInstallationOwnerGid(installationId) {
  const raw = String(installationId ?? "");
  if (!raw) return null;
  if (raw.startsWith("gid://")) return raw;
  return `gid://shopify/AppInstallation/${raw}`;
}

/**
 * Prefer Gadget `shopifyAppInstallation` (Shopify AppInstallation id on `record.id`).
 * Fall back to Admin API when the model row is not synced yet.
 */
async function resolveAppInstallationOwnerGid({ api, shopId, logger }) {
  const installation = await api.shopifyAppInstallation.maybeFindFirst({
    filter: { shopId: { equals: String(shopId) } },
    select: { id: true },
  });

  if (installation?.id) {
    return toAppInstallationOwnerGid(installation.id);
  }

  logger?.warn(
    { shopId },
    "shopifyAppInstallation not found in Gadget; falling back to currentAppInstallation query"
  );

  const result = await shopifyGraphql({
    api,
    shopId,
    mutation: `query { currentAppInstallation { id } }`,
  });
  return toAppInstallationOwnerGid(result?.currentAppInstallation?.id);
}

/**
 * Load ACTIVE tabs + tabConfigs, write JSON to AppInstallation metafield (theme: `app.metafields`).
 * @param {{
 *   api: import("gadget-server").GadgetAPI;
 *   shopId: string;
 *   logger?: import("gadget-server").Logger;
 * }} args
 */
export async function syncStorefrontTabsToShopMetafield({ api, shopId, logger }) {
  if (!shopId) {
    throw new Error("shopId is required to sync storefront tabs metafield");
  }

  await ensureShopTabConfigs({ api, shopId, logger });

  const PAGE_SIZE = 250;
  const allTabs = [];
  let hasNextPage = true;
  let cursor = null;
  const tabFilter = {
    shopId: { equals: shopId },
    status: { equals: "ACTIVE" },
  };
  const tabSelect = {
    uid: true,
    title: true,
    position: true,
    contentType: true,
    appliesTo: true,
    content: true,
    targetIds: true,
  };

  while (hasNextPage) {
    const options = {
      first: PAGE_SIZE,
      filter: tabFilter,
      sort: { position: "Ascending" },
      select: tabSelect,
    };
    if (cursor) options.after = cursor;

    const page = await api.tab.findMany(options);
    if (!page?.length) break;

    allTabs.push(...page);
    hasNextPage = page.pageInfo?.hasNextPage ?? page?.hasNextPage ?? false;
    cursor = page?.endCursor ?? null;
  }

  const tabConfigsRow = await api.tabConfigs.maybeFindFirst({
    filter: { shopId: { equals: shopId } },
    select: { settings: true },
  });

  const isPlanSubscribed = await resolveIsPlanSubscribed({ api, shopId });

  const payload = {
    tabs: allTabs.map((tab) => ({
      uid: tab.uid,
      title: tab.title,
      position: tab.position,
      contentType: tab.contentType,
      appliesTo: tab.appliesTo,
      content: tab.content ?? {},
      targetIds: Array.isArray(tab.targetIds) ? tab.targetIds : [],
    })),
    tabConfigs: normalizeTabConfigsSettings(
      tabConfigsRow?.settings ?? createDefaultTabConfigsSettings()
    ),
    isPlanSubscribed,
  };

  const ownerId = await resolveAppInstallationOwnerGid({ api, shopId, logger });
  if (!ownerId) {
    throw new Error(
      "Could not resolve AppInstallation GID (shopifyAppInstallation record or currentAppInstallation)"
    );
  }

  const metafieldValue = JSON.stringify(payload);

  logger?.info(
    {
      shopId,
      ownerId,
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEY,
      activeTabCount: payload.tabs.length,
      isPlanSubscribed: payload.isPlanSubscribed,
    },
    "Writing premium product tabs app-data metafield to Shopify"
  );

  const setResult = await shopifyGraphql({
    api,
    shopId,
    mutation: METAFIELDS_SET_MUTATION,
    variables: {
      metafields: [
        {
          ownerId,
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_KEY,
          type: metafieldType,
          value: metafieldValue,
        },
      ],
    },
  });

  throwIfShopifyErrors(setResult?.metafieldsSet?.userErrors, "metafieldsSet");

  logger?.info(
    { shopId, activeTabCount: payload.tabs.length, setResult },
    "Synced premium product tabs to AppInstallation metafield"
  );

  return payload;
}

/** @param {{ api: import("gadget-server").GadgetAPI; shopId?: string | null; logger?: import("gadget-server").Logger }} args */
export async function enqueueStorefrontTabsMetafieldSync({ api, shopId, logger }) {
  if (!shopId) {
    logger?.warn("Skipping storefront metafield sync: missing shopId");
    return;
  }
  await api.enqueue(api.syncStorefrontTabsMetafield, { shopId: String(shopId) });
}

/** Call from tab / tabConfigs `onSuccess`. */
export async function enqueueStorefrontSyncForTabRecord({ api, record, logger }) {
  const shopId = record?.shopId ?? record?.shop?.id ?? null;
  await enqueueStorefrontTabsMetafieldSync({ api, shopId, logger });
}
