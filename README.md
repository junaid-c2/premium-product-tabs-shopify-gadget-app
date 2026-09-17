# Premium Product Tabs

**Custom tabs and accordions for Shopify product pages** — built on Gadget and Shopify theme app extensions.

Merchants organize extra product information (shipping, sizing, materials, metafields, and more) into clean **tabs** or **accordions** instead of one long description. Shoppers get scannable content; stores keep full control over layout, colors, and which products see which tabs.

---

## Table of contents

- [Overview](#overview)
- [Key features](#key-features)
- [How it works](#how-it-works)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Getting started (developers)](#getting-started-developers)
- [Storefront setup (merchants)](#storefront-setup-merchants)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

| | |
|---|---|
| **Platform** | Shopify embedded app |
| **Backend** | [Gadget](https://gadget.dev) (PostgreSQL, GraphQL API, background jobs) |
| **Storefront** | Theme app extension (`Premium Product Tabs` block on product templates) |
| **Billing** | Shopify app subscription; storefront widget requires an active plan |

The product splits into:

1. **Admin app** — manage tabs, global design settings, and a live storefront preview.
2. **Theme extension** — reads app-owned metafield data and renders the widget on the product page (Shadow DOM for stable styling).

---

## Key features

### Content & targeting

- Unlimited tabs per shop (ordered via drag-and-drop in admin).
- **Static** content with rich HTML, or **dynamic** content from product fields and supported product metafields.
- **Targeting**: all products, selected products, or selected collections.
- **Active / Hidden** status — only Active tabs appear on the storefront.

### Design & layout

- **Tabs** or **accordions** display mode.
- Tab styles: **underline** or **filled** headers.
- Global controls for colors (default, hover, active), typography (header + body), spacing, header borders, and outer **container** styling (border, background, inner spacing).
- Optional **block title** in the theme editor.

### Storefront behavior

- Product-aware filtering in Liquid (tabs shown only where targeting matches).
- Styles synced from admin; JavaScript mounts UI inside **Shadow DOM** to reduce theme CSS conflicts.
- **Subscription gate**: widget loads only when synced data has `isPlanSubscribed: true` (derived from the shop’s latest app subscription by `createdAt` and `ACTIVE` status).

---

## How it works

### Merchant flow

```text
Install app → Create tabs → Set Active + targeting → Customize Settings → Add theme block → Publish
```

### Technical flow

```text
Admin (React)  →  Gadget models (tab, tabConfigs)
                        ↓
              syncStorefrontTabsMetafield
                        ↓
        AppInstallation metafield: premium_product_tabs.storefront
        { tabs, tabConfigs, isPlanSubscribed }
                        ↓
        Theme Liquid (filter by product) → JSON → premium-product-tabs.js → UI
```

Sync runs on install/reinstall, tab and settings changes, and app subscription create/update/delete.

---

## Technology

| Layer | Stack |
|-------|--------|
| Admin UI | React 19, React Router 7, Shopify App Bridge, Polaris web components |
| API | Gadget models & actions, Gelly access control |
| Storefront | Liquid snippets, vanilla JS, CSS (inlined into Shadow DOM) |
| Shopify | Theme app extension, app-data metafields, billing subscriptions |
| Tooling | Vite, Yarn, Shopify CLI, `ggt` CLI |

---

## Project structure

```text
premium-product-tabs/
├── api/
│   ├── models/tab/                 # Tab CRUD, content, targeting, position
│   ├── models/tabConfigs/          # Shop-level settings JSON
│   ├── models/shopifyShop/         # Install hooks
│   ├── models/shopifyAppSubscription/
│   ├── actions/                    # Global actions (sync, ensure configs)
│   └── utils/                      # Metafield sync, settings defaults, billing flag
├── web/
│   ├── routes/                     # Index (list + settings), tab editor
│   └── components/product-tabs/    # Forms, preview, rich text editor
├── extensions/premium-product-tabs/
│   ├── blocks/product_tabs.liquid
│   ├── snippets/                   # Metafield → product JSON
│   └── assets/                     # Storefront JS & CSS
├── accessControl/                  # Multi-tenant shop filters
├── shopify.app.toml
└── package.json
```

| Module | Responsibility |
|--------|----------------|
| `syncStorefrontMetafield.js` | Build payload, write Shopify metafield |
| `tabConfigsSettings.js` | Default install settings, normalize, preview CSS variables |
| `isPlanSubscribed.js` | Latest subscription → boolean for metafield |
| `ensureShopTabConfigs.js` | Create default settings row on first install |

---

## Getting started (developers)

**Requirements:** Node.js (LTS), Yarn 1.x, Gadget app access, Shopify CLI, Partner app + dev store.

```bash
yarn install
ggt dev                    # Gadget backend + admin (link repo to Gadget)
yarn shopify:dev           # Deploy & run theme extension against dev store
```

| Command | Purpose |
|---------|---------|
| `yarn build` | Production frontend build |
| `yarn shopify:deploy:production` | Deploy extension (production config) |
| `yarn shopify:deploy:development` | Deploy extension (development config) |

---

## Storefront setup (merchants)

1. Subscribe to a paid plan (required for customer-facing tabs).
2. In the app: create tabs, set **Active**, configure **Settings**.
3. In the theme editor: open the **product** template → add **Premium Product Tabs** → save.

If nothing appears on the product page, verify subscription is active, at least one tab is Active and matches targeting, and the theme block is on that template.

---

## Documentation

- In-repo Gadget index: [AGENTS.md](./AGENTS.md)
- Gadget Shopify guides: [docs.gadget.dev/guides/plugins/shopify](https://docs.gadget.dev/guides/plugins/shopify/building-shopify-apps.md)
- Gadget CLI: [docs.gadget.dev/reference/ggt](https://docs.gadget.dev/reference/ggt.md)

---

## License

Private — **UNLICENSED**. Not for public redistribution without permission.
