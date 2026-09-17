import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "tabConfigs" model, go to https://premium-product-tabs.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "2yDgJKnG2a8a",
  fields: {
    settings: { type: "json", storageKey: "V0_TYgk0BUX7" },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "3FA2LSJVD9IY",
    },
  },
};
