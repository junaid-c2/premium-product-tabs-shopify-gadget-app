export const params = {
  shopId: { type: "string" },
  mutation: { type: "string" },
  variables: { type: "object", additionalProperties: true },
};

/** @type { ActionRun } */
export const run = async ({ params, connections }) => {
  if (!params?.shopId || !params?.mutation) {
    throw new Error("shopId and mutation are required");
  }

  const shopify = await connections.shopify.forShopId(String(params.shopId));
  return shopify.graphql(params.mutation, params.variables);
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true,
  },
};
