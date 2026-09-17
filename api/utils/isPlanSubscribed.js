/**
 * Whether the shop may use storefront tabs, from the latest AppSubscription by `createdAt`.
 * @param {{ api: import("gadget-server").GadgetAPI; shopId?: string | null }} args
 */
export async function resolveIsPlanSubscribed({ api, shopId }) {
  if (!shopId) return false;

  const latest = await api.shopifyAppSubscription.maybeFindFirst({
    filter: { shopId: { equals: String(shopId) } },
    sort: { createdAt: "Descending" },
    select: { status: true },
  });

  if (!latest) return false;
  return latest.status === "ACTIVE";
}
