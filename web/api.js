// Sets up the API client for interacting with your backend.
// For your API reference, visit: https://docs.gadget.dev/api/premium-product-tabs
import { Client } from "@gadget-client/premium-product-tabs";

export const api = new Client({ environment: window.gadgetConfig.environment });