import { syncStorefrontTabsToShopMetafield } from "../utils/syncStorefrontMetafield.js";

export const params = {
  shopId: { type: "string" },
};

/** @type { GlobalActionRun } */
export const run = async ({ params, api, logger }) => {
  if (!params?.shopId) {
    throw new Error("shopId is required");
  }

  return syncStorefrontTabsToShopMetafield({ api, shopId: params.shopId, logger });
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true,
  },
};
