/** Shopify Admin toast via App Bridge (Polaris web components / embedded app). */
export function showToast(message, { error = false } = {}) {
  if (typeof shopify !== "undefined" && shopify.toast?.show) {
    shopify.toast.show(message, { isError: error });
    return;
  }
  console.log(error ? `[error] ${message}` : message);
}
