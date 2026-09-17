import { applyParams, save, ActionOptions } from "gadget-server";
import { createShortUID } from "../../../utils/helper.js";
import { enqueueStorefrontSyncForTabRecord } from "../../../utils/syncStorefrontMetafield.js";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  record.uid = createShortUID();
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ record, api, logger }) => {
  await enqueueStorefrontSyncForTabRecord({ api, record, logger });
};

/** @type { ActionOptions } */
export const options = {
  actionType: "create",
};
