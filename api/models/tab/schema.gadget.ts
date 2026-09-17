import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "tab" model, go to https://premium-product-tabs.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "fArniqtofBGH",
  fields: {
    appliesTo: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["all", "specific_products", "specific_collections"],
      validations: { required: true },
      storageKey: "35f7QGk8mAqh",
    },
    content: {
      type: "json",
      storageKey: "1FBymac8DiFR",
      filterIndex: false,
      searchIndex: false,
    },
    contentType: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["STATIC", "DYNAMIC"],
      storageKey: "8pkZGKkE1tv_",
    },
    position: {
      type: "number",
      validations: { required: true },
      storageKey: "KfvgIPLwhe9f",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "Rt65Qwhk1nXB",
    },
    status: {
      type: "enum",
      default: "DISABLE",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["ACTIVE", "DISABLE"],
      storageKey: "3che1ckYr7AJ",
    },
    targetIds: {
      type: "json",
      storageKey: "3V1JG4-qX8TK",
      filterIndex: false,
      searchIndex: false,
    },
    title: {
      type: "string",
      validations: { required: true },
      storageKey: "qKPa2dHMkfVt",
    },
    uid: { type: "string", storageKey: "gylPjAVXhI-l" },
  },
};
