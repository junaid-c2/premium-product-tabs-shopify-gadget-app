import {
  createDefaultTabConfigsSettings,
  normalizeTabConfigsSettings,
} from "./tabConfigsSettings.js";

/**
 * Create the shop's single `tabConfigs` row on install if it does not exist.
 * @param {{
 *   api: import("gadget-server").GadgetAPI;
 *   shopId: string;
 *   logger?: import("gadget-server").Logger;
 * }} args
 */
export async function ensureShopTabConfigs({ api, shopId, logger }) {
  if (!shopId) return null;

  const existing = await api.tabConfigs.maybeFindFirst({
    filter: { shopId: { equals: shopId } },
    select: { id: true },
  });

  if (existing) {
    logger?.info({ shopId, tabConfigsId: existing.id }, "tabConfigs already exists for shop");
    return existing;
  }

  const settings = normalizeTabConfigsSettings(createDefaultTabConfigsSettings());
  const record = await api.tabConfigs.create({
    settings,
    shop: { _link: shopId },
  });

  logger?.info({ shopId, tabConfigsId: record.id }, "Created default tabConfigs for shop");
  return record;
}
