import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ record, api }) => {
  await api.enqueue(api.ensureShopTabConfigs, { shopId: record.id });
  await api.enqueue(api.syncStorefrontTabsMetafield, { shopId: record.id });

  await api.shopifySync.run({
    domain: record.domain,
    shop: {
      _link: record?.id,
    },
    models: ["shopifyAppSubscription", "shopifyApp", "shopifyAppInstallation"]
  });
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
