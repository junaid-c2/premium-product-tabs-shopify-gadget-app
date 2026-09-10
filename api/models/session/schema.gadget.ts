import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "session" model, go to https://premium-product-tabs.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "6qKJ9xgyuiLo",
  fields: {
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "KmOOhagnv1_t",
    },
  },
  shopify: { fields: { shop: true, shopifySID: true } },
};
