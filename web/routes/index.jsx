import { useAction, useBulkAction, useFindFirst, useFindMany, useSession } from "@gadgetinc/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { ConfirmModal } from "../components/product-tabs/ConfirmModal";
import { TabGlobalSettingsForm } from "../components/product-tabs/TabGlobalSettingsForm";
import { TabStorefrontPreview } from "../components/product-tabs/TabStorefrontPreview";
import {
  createDefaultTabConfigsSettings,
  normalizeTabConfigsSettings,
} from "../../api/utils/tabConfigsSettings.js";
import { CONTENT_TYPE, CONTENT_TYPE_LABELS } from "../../api/utils/constants.js";
import {
  NEW_TAB_UID,
  buildTabPositionUpdates,
  formToApiParams,
  getTargetingRefsFromApiTab,
  normalizeTabPositions,
  recordToForm,
  reorderList,
  serverTabOrderMatches,
} from "../utils/helper";
import { showToast } from "../utils/toast";
import { normalizeActionError, useActionErrorReporter } from "../utils/error";
import SpinnerLoader from "../components/Loader";

function StatusBadge({ status }) {
  if (status === "ACTIVE") {
    return <s-badge tone="success">Active</s-badge>;
  }
  if (status === "DRAFT") {
    return <s-badge tone="warning">Draft</s-badge>;
  }
  return <s-badge tone="neutral">Hidden</s-badge>;
}

function ContentTypeBadge({ contentType }) {
  if (contentType === "DYNAMIC") {
    return <s-badge tone="info">{CONTENT_TYPE_LABELS[CONTENT_TYPE.DYNAMIC]}</s-badge>;
  }
  return <s-badge>{CONTENT_TYPE_LABELS[CONTENT_TYPE.STATIC]}</s-badge>;
}

function TargetingBadge({ tab }) {
  const { products, collections } = getTargetingRefsFromApiTab(tab);

  if (tab.appliesTo === "all") return <s-badge>All Products</s-badge>;
  if (tab.appliesTo === "specific_products") {
    if (products.length === 0) return <s-badge tone="warning">No products selected</s-badge>;
    return <s-badge>{products.length === 1 ? "1 Product" : `${products.length} Products`}</s-badge>;
  }
  if (tab.appliesTo === "specific_collections") {
    if (collections.length === 0) return <s-badge tone="warning">No collections selected</s-badge>;
    if (collections.length === 1) {
      return <s-badge>{collections[0]?.title ?? "1 Collection"}</s-badge>;
    }
    return <s-badge>{`${collections.length} Collections`}</s-badge>;
  }
  return <s-badge>All Products</s-badge>;
}

function tabsListRowClassName({ isSelected, isDragging, isDropHover, reorderActive }) {
  return [
    "tabs-list__row",
    isSelected && "tabs-list__row--selected",
    reorderActive && "tabs-list__row--reorder-active",
    isDragging && "tabs-list__row--dragging",
    isDropHover && "tabs-list__row--drop-hover",
  ]
    .filter(Boolean)
    .join(" ");
}

export const IndexPage = () => {
  const { shopId, ...restSession } = useSession();
  const navigate = useNavigate();

  const [{ data: shopData, fetching: loadingShop, error: shopError }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      myshopifyDomain: true,
      chargeId: true,
      domain: true,
      appSubscriptions: {
        edges: {
          node: {
            status: true,
          }
        }
      }
    },
  });

  useEffect(() => {
    console.log("ShopData:", shopData, restSession);
    if (shopData && !shopData?.chargeId && shopData?.appSubscriptions?.edges?.every(edge => edge?.node?.status !== "ACTIVE")) {

      const storeHandle = shopData?.myshopifyDomain?.split?.(".")[0];
      const redirectURL = `https://admin.shopify.com/store/${storeHandle}/charges/${process.env.GADGET_PUBLIC_SHOPIFY_APP_HANDLE}/pricing_plans`;
      window.parent.location.href = redirectURL;
      console.log("Redirecting to:", redirectURL);
    }
  }, [shopData]);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggingTabUid, setDraggingTabUid] = useState(null);
  const [dropHoverIndex, setDropHoverIndex] = useState(null);
  const [orderedTabs, setOrderedTabs] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewTabUid, setPreviewTabUid] = useState(null);
  const [indexView, setIndexView] = useState("tabs");
  const [settingsDraft, setSettingsDraft] = useState(() => createDefaultTabConfigsSettings());
  const lastSyncedSettingsJsonRef = useRef(null);
  const orderedTabsRef = useRef(orderedTabs);
  orderedTabsRef.current = orderedTabs;
  const draggedIndexRef = useRef(null);
  const serverTabsAtDragStartRef = useRef([]);
  const pendingOrderIdsRef = useRef(null);
  const didInitPreviewTabUidRef = useRef(false);


  const [{ data: tabsData, fetching: tabsFetching, error: tabsError }] = useFindMany(api.tab, {
    sort: { position: "Ascending" },
    live: true,
    select: {
      id: true,
      uid: true,
      title: true,
      contentType: true,
      appliesTo: true,
      status: true,
      position: true,
      targetIds: true,
      content: true,
    },
  });

  const [{ data: deleteTabData, fetching: deletingTab, error: deleteTabError }, deleteTab] = useAction(api.tab.delete);
  const [{ data: createTabData, fetching: creatingTab, error: createTabError }, createTab] = useAction(api.tab.create);
  const [{ error: bulkUpdateTabError, fetching: bulkUpdatingTab }, bulkUpdateTabs] =
    useBulkAction(api.tab.bulkUpdate);

  const [{ data: tabConfigsRecord, fetching: configsFetching, error: configsError }] = useFindFirst(
    api.tabConfigs,
    {
      live: true,
      pause: !shopId,
      filter: shopId ? { shopId: { equals: shopId } } : undefined,
      select: { id: true, settings: true },
    }
  );

  const [{ fetching: savingConfigs, error: updateConfigsError }, updateTabConfigs] = useAction(
    api.tabConfigs.update
  );
  const [{ fetching: creatingConfigs, error: createConfigsError }, createTabConfigs] = useAction(
    api.tabConfigs.create
  );

  const tabs = tabsData ?? [];
  const goToNew = useCallback(() => navigate(`/tabs/${NEW_TAB_UID}`), [navigate]);

  useEffect(() => {
    if (draggedIndex !== null) return;

    const pendingIds = pendingOrderIdsRef.current;
    if (pendingIds) {
      if (!serverTabOrderMatches(tabs, pendingIds)) return;
      pendingOrderIdsRef.current = null;
    }

    setOrderedTabs(tabs);
  }, [tabs, draggedIndex]);

  useEffect(() => {
    if (!orderedTabs.length) {
      setPreviewTabUid(null);
      didInitPreviewTabUidRef.current = false;
      return;
    }
    if (!didInitPreviewTabUidRef.current) {
      didInitPreviewTabUidRef.current = true;
      setPreviewTabUid(orderedTabs[0].uid);
      return;
    }
    if (
      previewTabUid != null &&
      !orderedTabs.some((tab) => tab.uid === previewTabUid)
    ) {
      setPreviewTabUid(orderedTabs[0].uid);
    }
  }, [orderedTabs, previewTabUid]);

  useEffect(() => {
    if (!tabConfigsRecord) return;
    const json = JSON.stringify(tabConfigsRecord.settings ?? {});
    if (json === lastSyncedSettingsJsonRef.current) return;
    lastSyncedSettingsJsonRef.current = json;
    setSettingsDraft(normalizeTabConfigsSettings(tabConfigsRecord.settings));
  }, [tabConfigsRecord]);

  useActionErrorReporter(
    [
      { err: tabsError, msg: "Error fetching tabs" },
      { err: deleteTabError, msg: "Error deleting tab" },
      { err: createTabError, msg: "Error creating tab" },
      { err: bulkUpdateTabError, msg: "Error bulk updating tab" },
      { err: configsError, msg: "Error loading tab settings" },
      { err: updateConfigsError, msg: "Error saving tab settings" },
      { err: createConfigsError, msg: "Error creating tab settings" },
    ],
    [
      tabsError,
      deleteTabError,
      createTabError,
      bulkUpdateTabError,
      configsError,
      updateConfigsError,
      createConfigsError,
    ]
  );

  const handleSaveSettings = useCallback(async () => {
    if (!shopId) return;
    const settings = normalizeTabConfigsSettings(settingsDraft);
    try {
      if (tabConfigsRecord?.id) {
        await updateTabConfigs({
          id: tabConfigsRecord.id,
          settings,
        });
      } else {
        await createTabConfigs({
          settings,
          shop: { _link: shopId },
        });
      }
      setSettingsDraft(settings);
      lastSyncedSettingsJsonRef.current = JSON.stringify(settings);
      showToast("Settings saved");
    } catch {
      showToast("Could not save settings", { error: true });
    }
  }, [shopId, tabConfigsRecord?.id, settingsDraft, updateTabConfigs, createTabConfigs]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteTab({ id: deleteTarget.id });
      showToast(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      // refresh();
    } catch {
      showToast("Could not delete tab", { error: true });
    }
  }, [deleteTarget, deleteTab]);

  const handleDuplicate = useCallback(
    async (tab) => {
      console.log("createTab", tab);
      try {
        const params = formToApiParams(recordToForm(tab));
        await createTab({
          ...params,
          title: `${tab.title} (copy)`,
          position: tabs.length,
          shop: {
            _link: shopId,
          },
          status: "DRAFT"
        });
        showToast("Tab duplicated");
        // refresh();
      } catch {
        showToast("Could not duplicate tab", { error: true });
      }
    },
    [createTab, tabs?.length]
  );

  const isReordering = draggedIndex !== null;

  const handleDragStart = useCallback(
    (index, tabUid, event) => {
      serverTabsAtDragStartRef.current = tabs;
      draggedIndexRef.current = index;
      setDraggedIndex(index);
      setDraggingTabUid(tabUid);
      setDropHoverIndex(index);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", tabUid);
      }
    },
    [tabs]
  );

  const handleDragOverRow = useCallback((toIndex) => {
    const fromIndex = draggedIndexRef.current;
    if (fromIndex === null) return;
    setDropHoverIndex(toIndex);
    if (fromIndex === toIndex) return;

    setOrderedTabs((prev) =>
      normalizeTabPositions(reorderList(prev, fromIndex, toIndex))
    );
    draggedIndexRef.current = toIndex;
    setDraggedIndex(toIndex);
  }, []);

  const handleDragEnd = useCallback(async () => {
    const nextOrder = orderedTabsRef.current;
    const updates = buildTabPositionUpdates(
      serverTabsAtDragStartRef.current,
      nextOrder
    );

    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDraggingTabUid(null);
    setDropHoverIndex(null);

    if (updates.length === 0) return;

    const expectedIds = nextOrder.map((tab) => tab.id);
    pendingOrderIdsRef.current = expectedIds;
    setOrderedTabs(nextOrder);

    const result = await bulkUpdateTabs(updates);
    if (result?.error) {
      pendingOrderIdsRef.current = null;
      console.error("Error bulk updating tab order", normalizeActionError(result.error));
      showToast("Could not reorder tabs", { error: true });
      setOrderedTabs(serverTabsAtDragStartRef.current);
      return;
    }

    if (serverTabOrderMatches(tabs, expectedIds)) {
      pendingOrderIdsRef.current = null;
    }
  }, [tabs, bulkUpdateTabs]);

  return (
    <>
      {(tabsFetching || configsFetching) && <SpinnerLoader />}
      {/* <pre>{JSON.stringify({restSession, shopData}, null, 2)}</pre> */}
      <s-page heading="Product Tabs" inlineSize="large" subheading="Manage tabs shown on your product pages">
        {indexView === "tabs" ? (
          <s-button slot="primary-action" onClick={goToNew}>
            Add tab
          </s-button>
        ) : (
          <s-button
            slot="primary-action"
            onClick={handleSaveSettings}
            loading={savingConfigs || creatingConfigs}
          >
            Save settings
          </s-button>
        )}


        <s-section background="none" border="none" borderRadius="none" padding="none">
          <s-banner tone="info">
            <s-stack gap="base">
            
              <s-stack gap="small-200">
                <s-text type="strong">About this app</s-text>
                <ul className="index-page__info-banner-list">
                  <li>
                    Premium Product Tabs adds custom tabs or accordions to product pages so shoppers
                    see extra content without cluttering the main description.
                  </li>
                  <li>
                    Each tab can use fixed rich text or dynamic content (description, metafields,
                    tags, and more).
                  </li>
                  <li>
                    Control who sees each tab with targeting for all products, specific products, or
                    collections.
                  </li>
                </ul>
              </s-stack>

              <s-stack gap="small-200">
                <s-text type="strong">How it works</s-text>
                <ul className="index-page__info-banner-list">
                  <li>Create and order tabs here in the admin; set status to Active when ready.</li>
                  <li>
                    Customize layout and colors under <strong>Settings</strong> → tabs vs accordions, typography, and
                    container styling.
                  </li>
                  <li>
                    In the theme editor, add the <strong>Premium Product Tabs</strong> app block to your
                    product template.
                  </li>
                  {/* <li>
                    With an active subscription, your tabs sync to the storefront automatically;
                    without it, customers will not see the widget on product pages.
                  </li> */}
                </ul>
              </s-stack>

              <s-stack gap="small-200">
                <s-text type="strong">Good to know</s-text>
                <ul className="index-page__info-banner-list">
                  <li>Only tabs marked Active appear to customers; Hidden tabs stay in admin only.</li>
                  <li>Use the live preview on this page to check layout before publishing changes.</li>
                  <li>
                    Drag rows in the Tabs list to change the order shown on the product page.
                  </li>
                </ul>
              </s-stack>
            </s-stack>
          </s-banner>
        </s-section>

        <s-section>
          <s-grid
            gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))"
            gap="large-100"
          >
            <s-grid
              background="base"
              border="base"
              borderRadius="base"
              padding="base"
              gap="small-400"
            >
              <div className="index-page__view-toggle" role="tablist" aria-label="Index sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={indexView === "tabs"}
                  className={
                    indexView === "tabs"
                      ? "index-page__view-toggle-btn index-page__view-toggle-btn--active"
                      : "index-page__view-toggle-btn"
                  }
                  onClick={() => setIndexView("tabs")}
                >
                  Tabs
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={indexView === "settings"}
                  className={
                    indexView === "settings"
                      ? "index-page__view-toggle-btn index-page__view-toggle-btn--active"
                      : "index-page__view-toggle-btn"
                  }
                  onClick={() => setIndexView("settings")}
                >
                  Settings
                </button>
              </div>

              {indexView === "settings" ? (
                <s-grid
                  background="base"
                  border="base"
                  borderRadius="base"
                  padding="base"
                  gap="small-400"
                >
                  <div className="index-page__settings-panel">
                    <TabGlobalSettingsForm
                      settings={settingsDraft}
                      onChange={(next) => setSettingsDraft(normalizeTabConfigsSettings(next))}
                      disabled={configsFetching || savingConfigs || creatingConfigs}
                    />
                  </div>
                </s-grid>
              ) : (
                <div
                  className={
                    isReordering
                      ? "tabs-list__table-wrap tabs-list__table-wrap--reordering"
                      : "tabs-list__table-wrap"
                  }
                >
                  <s-banner tone="info">
                    <s-stack gap="small-200">
                      <s-text type="strong">Reorder tabs</s-text>
                      <s-text tone="subdued">
                        Grab the handle on the left and drag rows up or down. Order updates in the preview as you move.
                        Click a tab name to preview; use the menu for Edit, Duplicate, or Delete.
                      </s-text>
                    </s-stack>
                  </s-banner>
                  <s-grid
                    background="base"
                    border="base"
                    borderRadius="base"
                    padding="none"
                    gap="small-400"
                  >
                    <s-table loading={tabsFetching || bulkUpdatingTab || deletingTab || creatingTab}>
                      <s-table-header-row>
                        <s-table-header listSlot="kicker">Order</s-table-header>
                        {/* <s-table-header listSlot="primary">ID</s-table-header>
                        <s-table-header listSlot="primary">Position</s-table-header> */}
                        <s-table-header listSlot="primary">Tab</s-table-header>
                        <s-table-header listSlot="labeled">Targeting</s-table-header>
                        <s-table-header listSlot="inline">Status</s-table-header>
                        <s-table-header listSlot="labeled">Actions</s-table-header>
                      </s-table-header-row>
                      <s-table-body>
                        {orderedTabs.map((tab, index) => {
                          const isSelected = tab.uid === previewTabUid;
                          const isDragging = draggingTabUid === tab.uid;
                          const isDropHover =
                            isReordering && dropHoverIndex === index && !isDragging;
                          const actionsPopoverId = `tab-actions-${tab.uid ?? tab.id}`;
                          return (
                            <s-table-row
                              key={tab.uid ?? tab.id}
                              className={tabsListRowClassName({
                                isSelected,
                                isDragging,
                                isDropHover,
                                reorderActive: isReordering,
                              })}
                              onDragOver={(event) => {
                                event.preventDefault();
                                handleDragOverRow(index);
                              }}
                            >
                              <s-table-cell>
                                <button
                                  type="button"
                                  className={
                                    isDragging
                                      ? "tabs-list__drag-handle tabs-list__drag-handle--active"
                                      : "tabs-list__drag-handle"
                                  }
                                  draggable
                                  aria-label={`Reorder ${tab.title}, currently position ${index + 1}`}
                                  onDragStart={(event) => handleDragStart(index, tab.uid, event)}
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    handleDragOverRow(index);
                                  }}
                                  onDragEnd={handleDragEnd}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <span className="tabs-list__order-badge">{index + 1}</span>
                                  <s-icon type="drag-handle" />
                                </button>
                              </s-table-cell>
                              {/* <s-table-cell>
                                <s-text>{tab.id}</s-text>
                              </s-table-cell>
                              <s-table-cell>
                                <s-text>{tab?.position}</s-text>
                              </s-table-cell> */}
                              <s-table-cell>
                                <s-clickable
                                  onClick={() => setPreviewTabUid(tab.uid)}
                                  accessibilityLabel={`Preview ${tab.title}`}
                                >
                                  <s-stack gap="small">
                                    <s-text type="strong">{tab.title}</s-text>
                                    <ContentTypeBadge contentType={tab.contentType} />
                                  </s-stack>
                                </s-clickable>
                              </s-table-cell>
                              <s-table-cell>
                                <TargetingBadge tab={tab} />
                              </s-table-cell>
                              <s-table-cell>
                                <StatusBadge status={tab.status} />
                              </s-table-cell>
                              <s-table-cell>
                                <s-button
                                  variant="tertiary"
                                  icon="menu-horizontal"
                                  accessibilityLabel={`Actions for ${tab.title}`}
                                  commandFor={actionsPopoverId}
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <s-popover id={actionsPopoverId}>
                                  <s-stack direction="block">
                                    <s-button
                                      variant="tertiary"
                                      commandFor={actionsPopoverId}
                                      command="--hide"
                                      onClick={() => navigate(`/tabs/${tab.uid}`)}
                                    >
                                      Edit
                                    </s-button>
                                    <s-button
                                      variant="tertiary"
                                      commandFor={actionsPopoverId}
                                      command="--hide"
                                      onClick={() => handleDuplicate(tab)}
                                    >
                                      Duplicate
                                    </s-button>
                                    <s-button
                                      variant="tertiary"
                                      tone="critical"
                                      commandFor={actionsPopoverId}
                                      command="--hide"
                                      onClick={() =>
                                        setDeleteTarget({
                                          id: tab.id,
                                          uid: tab.uid,
                                          title: tab.title,
                                        })
                                      }
                                    >
                                      Delete
                                    </s-button>
                                  </s-stack>
                                </s-popover>
                              </s-table-cell>
                            </s-table-row>
                          );
                        })}
                      </s-table-body>
                    </s-table>
                  </s-grid>
                </div>
              )}
            </s-grid>

            <TabStorefrontPreview
              tabs={orderedTabs}
              activeUid={previewTabUid}
              onSelectTab={setPreviewTabUid}
              settings={settingsDraft}
            />
          </s-grid>
        </s-section>

        <ConfirmModal
          modalId="delete-tab-modal"
          open={Boolean(deleteTarget)}
          title="Delete tab?"
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.title}"? This can't be undone.`
              : ""
          }
          confirmLabel="Delete tab"
          destructive
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </s-page>
    </>
  );
};
