# premium-product-tabs-s## About

Premium Product Tabs is a Shopify app built on [Gadget](https://gadget.dev). Merchants add extra product-page content as **tabs** or **accordions** (shipping, specs, care instructions, metafields, and more) without replacing the main product description.

The app has two parts:

- **Embedded admin** — create tabs, set global styling, and preview changes.
- **Theme app extension** — a product-page block that reads synced app data and renders the widget on the storefront.

Storefront display requires an **active app subscription**; subscription state is stored in the app-owned metafield alongside tab data.

---



## Features

**Tab management**

- Create, edit, duplicate, delete, and drag-to-reorder tabs.
- **Static** rich text or **dynamic** content (description, vendor, type, tags, SKU, product metafields).
- Target **all products**, **specific products**, or **collections**.
- **Active** tabs show to customers; **Hidden** tabs are admin-only.

**Global settings**

- Layout: **tabs** or **accordions**; tab style **underline** or **filled**.
- Colors for default, hover, and active states; header and body typography.
- Spacing, header borders, container border/background/padding, and content padding.

**Storefront**

- **Premium Product Tabs** app block with optional block title.
- Styles from global settings; UI isolated with **Shadow DOM**.
- Tabs filtered per product in Liquid; only rendered when subscription is active.

**Billing**

- `isPlanSubscribed` in synced JSON — `true` when the latest app subscription (by `createdAt`) has status `ACTIVE`.

---



## Structure

```
premium-product-tabs/
├── api/                          # Gadget backend
│   ├── models/
│   │   ├── tab/                  # Tab records (content, targeting, order, status)
│   │   ├── tabConfigs/           # Per-shop global settings JSON
│   │   └── shopifyShop/          # Install → default tabConfigs + metafield sync
│   ├── actions/
│   │   ├── syncStorefrontTabsMetafield.js
│   │   └── ensureShopTabConfigs.js
│   └── utils/
│       ├── syncStorefrontMetafield.js   # Metafield payload → Shopify
│       ├── tabConfigsSettings.js        # Defaults & CSS vars for preview
│       ├── isPlanSubscribed.js
│       └── constants.js
├── web/                          # Embedded admin (React Router)
│   ├── routes/
│   │   ├── index.jsx             # Tab list, settings, preview
│   │   └── tabs.$uid.jsx         # Single-tab editor
│   └── components/product-tabs/  # Forms, preview, editor UI
├── extensions/premium-product-tabs/
│   ├── blocks/product_tabs.liquid
│   ├── snippets/                 # JSON data + targeting helpers
│   └── assets/                   # premium-product-tabs.js, .css
├── accessControl/                # Shop-scoped Gelly filters
└── shopify.app.toml              # Shopify app configuration
```

**Data flow**

1. Merchants edit **tabs** and **tabConfigs** in the admin API.
2. Changes trigger **syncStorefrontTabsMetafield** → AppInstallation metafield `premium_product_tabs.storefront` (JSON: `tabs`, `tabConfigs`, `isPlanSubscribed`).
3. Theme block reads `app.metafields.premium_product_tabs.storefront`, builds product-specific JSON, and **premium-product-tabs.js** renders tabs or accordions.

