import { deleteRecord, ActionOptions } from "gadget-server";
import { enqueueStorefrontSyncForTabRecord } from "../../../utils/syncStorefrontMetafield.js";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  await deleteRecord(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ record, api, logger }) => {
  await enqueueStorefrontSyncForTabRecord({ api, record, logger });
};

/** @type { ActionOptions } */
export const options = {
  actionType: "delete",
};
