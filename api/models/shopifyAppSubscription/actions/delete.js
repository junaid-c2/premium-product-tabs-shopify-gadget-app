import { deleteRecord, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { enqueueStorefrontTabsMetafieldSync } from "../../../utils/syncStorefrontMetafield.js";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  await preventCrossShopDataAccess(params, record);
  await deleteRecord(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  await enqueueStorefrontTabsMetafieldSync({
    api,
    shopId: record.shopId,
    logger,
  });
};

/** @type { ActionOptions } */
export const options = { actionType: "delete" };
