import { useEffect } from "react";

/** Show a normalized Gadget/API error (Shopify toast or alert fallback). */
export function reportActionError(messagePrefix, error) {
  if (!error) return;
  const normalized = normalizeActionError(error);
  console.error(messagePrefix, normalized);
  const finalMessage = `${messagePrefix}: ${normalized?.message}`;
  if (typeof shopify !== "undefined") {
    shopify.toast.show(finalMessage, { isError: true });
  } else {
    alert(`Error: ${finalMessage}`);
  }
}

/**
 * @param {Array<{ err: unknown, msg: string }>} entries
 * @param {unknown[]} deps - typically each entry's `err` for the effect dependency list
 */
export function useActionErrorReporter(entries, deps) {
  useEffect(() => {
    entries.forEach(({ err, msg }) => reportActionError(msg, err));
  }, deps);
}

export const normalizeActionError = (error) => {
  if (!error) {
    return {
      message: "An unknown error occurred.",
      topMessage: "An unknown error occurred.",
      validationErrors: [],
      isValidationError: false,
      raw: error,
    };
  }

  const topMessage = error.message || error.error?.message || "Something went wrong.";

  const validationErrors = Array.isArray(error.validationErrors)
    ? error.validationErrors.map((ve) => ({
      field: ve?.apiIdentifier || (Array.isArray(ve?.path) ? ve.path.join(".") : ve?.field) || "unknown",
      message: ve?.message || topMessage,
    }))
    : [];

  const graphQLErrors = Array.isArray(error.graphQLErrors)
    ? error.graphQLErrors.map((ge) => ({
      field: ge?.extensions?.field || "",
      message: ge?.message,
    }))
    : Array.isArray(error?.response?.errors)
      ? error.response.errors.map((ge) => ({
        field: ge?.extensions?.field || "",
        message: ge?.message,
      }))
      : [];

  const combinedValidation = [...validationErrors, ...graphQLErrors].filter((e) => e && e.message);
  const isValidationError = combinedValidation.length > 0;
  const firstValidation = combinedValidation[0];
  const friendlyMessage = isValidationError
    ? (firstValidation.field ? `${firstValidation.field}: ${firstValidation.message}` : firstValidation.message)
    : topMessage;

  return {
    message: friendlyMessage,
    topMessage,
    validationErrors: combinedValidation,
    isValidationError,
    raw: error,
  };
};