import { isAllowedDynamicMetafieldDefinitionType } from "../utils/constants.js";

const QUERY = `
  query ProductMetafieldDefinitions($first: Int!, $after: String) {
    metafieldDefinitions(first: $first, after: $after, ownerType: PRODUCT) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        namespace
        key
        type {
          name
        }
      }
    }
  }
`;

function toSelectOption(definition) {
  const namespace = definition.namespace ?? "";
  const key = definition.key ?? "";
  const name = definition.name?.trim?.() || `${namespace}.${key}`;
  return {
    label: `${name} (${namespace}.${key})`,
    value: `metafield:${namespace}.${key}`,
    namespace,
    key,
    type: definition.type?.name ?? null,
  };
}

function getConnection(result) {
  const data = result?.data ?? result;
  return data?.metafieldDefinitions;
}

/** @type { GlobalActionRun } */
export const run = async ({ api, connections, logger }) => {
  const shopId = connections.shopify.currentShopId;
  if (!shopId) {
    throw new Error("Shopify shop is not available for this session.");
  }

  const definitions = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await api.writeToShopify({
      shopId: String(shopId),
      mutation: QUERY,
      variables: { first: 100, after },
    });

    logger.info({ result: JSON.stringify(result) }, "fetchProductMetafieldDefinitions :: Result");

    const connection = getConnection(result);
    if (!connection) break;

    for (const node of connection.nodes ?? []) {
      const typeName = node?.type?.name;
      if (!node?.namespace || !node?.key) continue;
      if (!isAllowedDynamicMetafieldDefinitionType(typeName)) continue;
      definitions.push(toSelectOption(node));
    }

    hasNextPage = Boolean(connection.pageInfo?.hasNextPage);
    after = connection.pageInfo?.endCursor ?? null;
    if (hasNextPage && !after) break;
  }

  definitions.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return { definitions };
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true,
  },
};
