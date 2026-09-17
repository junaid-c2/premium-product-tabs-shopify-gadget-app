import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyAppSubscription" model, go to https://premium-product-tabs.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-AppSubscription",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      shop: { searchIndex: false },
      status: { searchIndex: false, fetchData: "onWebhook" },
    },
  },
};
