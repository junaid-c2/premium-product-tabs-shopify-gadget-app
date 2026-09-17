import { useAction, useFindFirst, useSession } from "@gadgetinc/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "../api";
import {
  TabEditorContentCard,
  TabEditorDetailsCard,
  TabEditorTargetingCard,
} from "../components/product-tabs/TabEditorFormSections";
import {
  TabEditorStatusCard,
  TabEditorSummaryCard,
} from "../components/product-tabs/TabEditorSidebar";
import { TARGETING } from "../../api/utils/constants.js";
import {
  NEW_TAB_UID,
  createEmptyContent,
  createEmptyTab,
  formToApiParams,
  recordToForm,
  resolveTemplatePreview,
  validateTab,
} from "../utils/helper";
import { normalizeActionError } from "../utils/error";
import { pickShopifyResources } from "../utils/resourcePicker";
import { showToast } from "../utils/toast";
import {
  buildDataSourceSelectOptions,
  loadProductMetafieldDefinitions,
} from "../utils/productMetafieldDefinitions";
import SpinnerLoader from "../components/Loader";

const TAB_SELECT = {
  id: true,
  uid: true,
  title: true,
  contentType: true,
  appliesTo: true,
  status: true,
  position: true,
  targetIds: true,
  content: true,
};

function BreadcrumbBack({ onClick }) {
  return (
    <s-button slot="breadcrumb-actions" onClick={onClick}>
      Product Tabs
    </s-button>
  );
}

export const TabDetailPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { shopId } = useSession();
  const isNew = !uid || uid === NEW_TAB_UID;

  const [tabDataInput, setTabDataInput] = useState(() => structuredClone(createEmptyTab()));
  const [validationErrors, setValidationErrors] = useState([]);
  const [productMetafieldOptions, setProductMetafieldOptions] = useState([]);
  const [metafieldDefinitionsState, setMetafieldDefinitionsState] = useState({
    loading: true,
    loadError: false,
  });

  const [{ data: tabData, fetching: tabFetching, error: tabError }] = useFindFirst(api.tab, {
    live: true,
    pause: isNew,
    filter: { uid: { equals: uid } },
    select: TAB_SELECT,
  });

  const [{ data: recentTabData }] = useFindFirst(api.tab, {
    live: true,
    pause: !isNew,
    sort: { position: "Descending" },
    select: { id: true, position: true },
  });

  const [{ data: createTabData, fetching: creatingTab, error: createTabError }, createTab] =
    useAction(api.tab.create, { select: TAB_SELECT });

  const [{ data: updateTabData, fetching: updatingTab, error: updateTabError }, updateTab] =
    useAction(api.tab.update, { select: TAB_SELECT });

  const tabMissing =
    tabError?.name === "MissingDataError" ||
    tabError?.message?.toLowerCase?.().includes("missing");

  const tabErrorToReport = tabError && !tabMissing ? tabError : null;

  const setTabDataFn = useCallback((data) => {
    if (!data) return;
    setTabDataInput(structuredClone(recordToForm(data)));
  }, []);

  useEffect(() => {
    if (isNew) {
      setTabDataInput(structuredClone(createEmptyTab()));
      setValidationErrors([]);
      return;
    }
    if (tabData) {
      setTabDataFn(tabData);
    }
  }, [isNew, tabData, setTabDataFn]);

  useEffect(() => {
    if (createTabData) {
      showToast("Tab created");
      setTabDataFn(createTabData);
      navigate(`/tabs/${createTabData.uid}`);
    }
    if (updateTabData) {
      showToast("Tab saved");
      setTabDataFn(updateTabData);
    }
  }, [createTabData, updateTabData, setTabDataFn, navigate]);

  useEffect(() => {
    const errors = [
      { err: tabErrorToReport, msg: "Error loading tab" },
      { err: createTabError, msg: "Error creating tab" },
      { err: updateTabError, msg: "Error updating tab" },
    ];

    errors.forEach(({ err, msg }) => {
      if (!err) return;
      const normalized = normalizeActionError(err);
      console.error(msg, normalized);
      const finalMessage = `${msg}: ${normalized?.message}`;
      if (typeof shopify !== "undefined") {
        shopify.toast.show(finalMessage, { isError: true });
      } else {
        alert(`Error: ${finalMessage}`);
      }
    });
  }, [tabErrorToReport, createTabError, updateTabError]);

  useEffect(() => {
    let cancelled = false;
    setMetafieldDefinitionsState({ loading: true, loadError: false });

    loadProductMetafieldDefinitions(api)
      .then((result) => {
        if (cancelled) return;
        setProductMetafieldOptions(result?.definitions ?? []);
        setMetafieldDefinitionsState({ loading: false, loadError: false });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error loading product metafield definitions", err);
        setMetafieldDefinitionsState({ loading: false, loadError: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dataSourceSelectOptions = useMemo(
    () => buildDataSourceSelectOptions(productMetafieldOptions, metafieldDefinitionsState),
    [productMetafieldOptions, metafieldDefinitionsState]
  );

  const previewText = useMemo(
    () => resolveTemplatePreview(tabDataInput?.content?.template),
    [tabDataInput?.content?.template]
  );

  const pageHeading = isNew ? "New tab" : tabData?.title?.trim() || "Edit tab";

  const titleError = validationErrors.includes("Title is required")
    ? "Title is required"
    : undefined;
  const targetingError = validationErrors.find((e) => e.startsWith("Select at least one"));
  const fallbackError = validationErrors.includes(
    "Fallback text is required when showing fallback content"
  )
    ? "Fallback text is required"
    : undefined;

  const goHome = useCallback(() => navigate("/"), [navigate]);

  const updateField = useCallback((field, value) => {
    setTabDataInput((prev) => {
      if (field.startsWith("content.")) {
        const key = field.slice("content.".length);
        return {
          ...prev,
          content: { ...createEmptyContent(), ...prev.content, [key]: value },
        };
      }
      return { ...prev, [field]: value };
    });
    setValidationErrors([]);
  }, []);

  const updateTargeting = useCallback((targeting) => {
    setTabDataInput((prev) => ({ ...prev, targeting }));
    setValidationErrors([]);
  }, []);

  const handleCreateTab = useCallback(async () => {
    const errors = validateTab(tabDataInput);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    const params = formToApiParams(tabDataInput);
    await createTab({
      ...params,
      position: (recentTabData?.position ?? -1) + 1,
      shop: shopId ? { _link: shopId } : undefined,
    });
  }, [tabDataInput, createTab, shopId, recentTabData?.position]);

  const handleUpdateTab = useCallback(async () => {
    const errors = validateTab(tabDataInput);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    const params = formToApiParams(tabDataInput);
    await updateTab({ id: tabDataInput.id, ...params });
  }, [tabDataInput, updateTab]);

  const pickResources = useCallback(
    async (kind) => {
      try {
        const existing =
          kind === "products"
            ? tabDataInput.selectedProducts
            : tabDataInput.selectedCollections;

        const picked = await pickShopifyResources(kind, existing);
        if (!picked?.length) return;

        setTabDataInput((prev) => ({
          ...prev,
          ...(kind === "products"
            ? { selectedProducts: picked }
            : { selectedCollections: picked }),
        }));
        setValidationErrors([]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not open resource picker";
        showToast(message, { error: true });
      }
    },
    [tabDataInput.selectedProducts, tabDataInput.selectedCollections]
  );

  const removeProduct = useCallback((id) => {
    setTabDataInput((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((p) => p.id !== id),
    }));
  }, []);

  const removeCollection = useCallback((id) => {
    setTabDataInput((prev) => ({
      ...prev,
      selectedCollections: prev.selectedCollections.filter((c) => c.id !== id),
    }));
  }, []);

  const pageProps = { inlineSize: "base" };
  const saving = isNew ? creatingTab : updatingTab;

  if (tabErrorToReport) {
    return (
      <s-page heading="Error" {...pageProps}>
        <BreadcrumbBack onClick={goHome} />
        <s-section>
          <s-banner tone="critical" heading="Could not load tab">
            {tabErrorToReport.message}
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  if (!isNew && !tabFetching && (tabMissing || !tabData)) {
    return (
      <s-page heading="Tab not found" {...pageProps}>
        <BreadcrumbBack onClick={goHome} />
        <s-section>
          <s-banner tone="critical" heading="This tab could not be found">
            It may have been deleted. Return to the tabs list to continue.
          </s-banner>
          <s-button onClick={goHome}>Back to Product Tabs</s-button>
        </s-section>
      </s-page>
    );
  }

  // if (!isNew && tabFetching && !tabData) {
  //   return (
  //     <s-page heading="Edit tab" {...pageProps}>
  //       <BreadcrumbBack onClick={goHome} />
  //       <s-section>
  //         <s-stack alignItems="center" padding="large">
  //           <s-spinner accessibilityLabel="Loading tab" size="large" />
  //         </s-stack>
  //       </s-section>
  //     </s-page>
  //   );
  // }

  return (
    <>
    {(!isNew && tabFetching && !tabData) && (<SpinnerLoader />)}
    <s-page heading={pageHeading} {...pageProps}>
        <BreadcrumbBack onClick={goHome} />
        <s-button
          slot="primary-action"
          onClick={() => (isNew ? handleCreateTab() : handleUpdateTab())}
          loading={saving}
        >
          {isNew ? "Create" : "Update"}
        </s-button>
        

        {/* {tabFetching && !isNew ? (
          <s-section>
            <s-stack alignItems="center" padding="base">
              <s-spinner accessibilityLabel="Refreshing tab" size="base" />
            </s-stack>
          </s-section>
        ) : null} */}

        {validationErrors.length > 0 ? (
          <s-section>
            <s-banner tone="critical" heading="Fix the following to save this tab">
              {validationErrors.join(". ")}
            </s-banner>
          </s-section>
        ) : null}

        {/* <pre>{JSON.stringify(tabData, null, 2)}</pre> */}
        <s-stack gap="large-100">
          <TabEditorDetailsCard
            tab={tabDataInput}
            isNew={isNew}
            uid={uid}
            titleError={titleError}
            onUpdateField={updateField}
          />
          <TabEditorTargetingCard
            tab={tabDataInput}
            targetingError={targetingError}
            onUpdateTargeting={updateTargeting}
            onPickResources={pickResources}
            onRemoveProduct={removeProduct}
            onRemoveCollection={removeCollection}
          />
          <TabEditorContentCard
            tab={tabDataInput}
            previewText={previewText}
            fallbackError={fallbackError}
            onUpdateField={updateField}
            dataSourceSelectOptions={dataSourceSelectOptions}
          />
        </s-stack>

        <s-box slot="aside">
          <s-stack gap="large-100">
            <TabEditorStatusCard
              tab={tabData}
              formStatus={tabDataInput.status}
              onUpdateField={updateField}
            />
            <TabEditorSummaryCard tab={tabDataInput} previewText={previewText} />
          </s-stack>
        </s-box>
    </s-page>
    </>
  );
};
