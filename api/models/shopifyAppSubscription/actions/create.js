import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { enqueueStorefrontTabsMetafieldSync } from "../../../utils/syncStorefrontMetafield.js";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  // Your logic goes here
  // Your logic goes here
  if (record.status === "ACTIVE") {
    await api.internal.shopifyShop.update(record.shopId, {
      chargeId: null
    });
  }

  await enqueueStorefrontTabsMetafieldSync({
    api,
    shopId: record.shopId,
    logger,
  });
};

/** @type { ActionOptions } */
export const options = { actionType: "create" };
