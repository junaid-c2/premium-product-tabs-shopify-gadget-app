import { CONTENT_TYPE, CONTENT_TYPE_LABELS } from "../../../api/utils/constants.js";
import {
  DISPLAY_TYPE,
  TAB_STYLE,
  createDefaultTabConfigsSettings,
  normalizeTabConfigsSettings,
  tabConfigsPreviewFrameStyle,
} from "../../../api/utils/tabConfigsSettings.js";
import {
  getApiTabPreviewContent,
  targetingSummaryFromApiTab,
} from "../../utils/helper";

function PreviewContent({ content, contentType }) {
  const looksLikeHtml =
    contentType !== "DYNAMIC" && /<[a-z][\s\S]*>/i.test(content ?? "");

  if (looksLikeHtml) {
    return (
      <div
        className="storefront-preview__content storefront-preview__content--html"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <div className="storefront-preview__content">{content}</div>;
}

function frameClassName(settings) {
  const s = normalizeTabConfigsSettings(settings);
  const parts = ["storefront-preview__frame"];
  if (s.displayType === DISPLAY_TYPE.ACCORDIONS) {
    parts.push("storefront-preview__frame--accordions");
  } else if (s.tabStyle === TAB_STYLE.FILLED) {
    parts.push("storefront-preview__frame--filled");
  } else {
    parts.push("storefront-preview__frame--underline");
  }
  return parts.join(" ");
}

export function TabStorefrontPreview({
  tabs,
  activeUid,
  onSelectTab,
  settings = createDefaultTabConfigsSettings(),
}) {
  const normalizedSettings = normalizeTabConfigsSettings(settings);
  const previewFrameStyle = tabConfigsPreviewFrameStyle(normalizedSettings);
  const isAccordion = normalizedSettings.displayType === DISPLAY_TYPE.ACCORDIONS;

  if (!tabs.length) {
    return (
      <aside className="storefront-preview-wrap storefront-preview-wrap--empty">
        <h2 className="storefront-preview-wrap__heading">Tabs preview</h2>
        <p className="storefront-preview-wrap__caption">
          Add a tab to preview how it will look on your product page.
        </p>
      </aside>
    );
  }

  const visibleTabs = tabs.filter((tab) => tab.status === "ACTIVE");
  const accordionOpenUid =
    isAccordion && activeUid != null && visibleTabs.some((tab) => tab.uid === activeUid)
      ? activeUid
      : null;
  const activeTab = tabs.find((tab) => tab.uid === activeUid) ?? tabs[0];
  const previewContent = getApiTabPreviewContent(activeTab);
  const isHidden = activeTab.status === "DISABLE";
  const activeVisible = visibleTabs.some((tab) => tab.uid === activeTab.uid);

  const triggerClassName = (isActive) =>
    [
      isAccordion ? "storefront-preview__accordion-trigger" : "storefront-preview__tab",
      isActive ? "storefront-preview__tab--active" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <s-grid
      background="base"
      border="base"
      borderRadius="base"
      padding="base"
      gap="small-400"
    >
      <aside className="storefront-preview-wrap" aria-label="Tabs preview">
        <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 className="storefront-preview-wrap__heading">Tabs preview</h2>
          <p className="storefront-preview-wrap__caption">
            {isAccordion ? "Accordion layout" : "Tab layout"}, order matches your list. Only{" "}
            <strong>Active</strong> tabs appear to customers.
          </p>

          <div className={frameClassName(normalizedSettings)} style={previewFrameStyle}>
            {visibleTabs.length === 0 ? (
              <p className="storefront-preview__no-tabs">
                No active tabs — customers will not see tabs until at least one tab is active.
              </p>
            ) : isAccordion ? (
              <>
                <div className="storefront-preview__accordion" role="presentation">
                  {visibleTabs.map((tab) => {
                    const isActive = tab.uid === accordionOpenUid;
                    return (
                      <div
                        key={tab.uid ?? tab.id}
                        className={
                          isActive
                            ? "storefront-preview__accordion-item storefront-preview__accordion-item--open"
                            : "storefront-preview__accordion-item"
                        }
                      >
                        <button
                          type="button"
                          className={triggerClassName(isActive)}
                          aria-expanded={isActive}
                          onClick={() => onSelectTab(isActive ? null : tab.uid)}
                        >
                          <span className="storefront-preview__accordion-trigger-label">
                            {tab.title}
                          </span>
                          <s-icon
                            type={isActive ? "chevron-up" : "chevron-down"}
                            className="storefront-preview__accordion-trigger-icon"
                          />
                        </button>
                        {isActive ? (
                          <div className="storefront-preview__accordion-panel">
                            <PreviewContent
                              content={getApiTabPreviewContent(tab)}
                              contentType={tab.contentType}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {isHidden ? (
                  <div className="storefront-preview__panel" role="tabpanel">
                    <div className="storefront-preview__notice storefront-preview__notice--hidden">
                      <strong>Hidden tab</strong>
                      <span>
                        This tab is not shown on the storefront. Content below is for your reference
                        only.
                      </span>
                    </div>
                    <PreviewContent content={previewContent} contentType={activeTab.contentType} />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="storefront-preview__tab-bar" role="tablist" aria-label="Product tabs">
                  {visibleTabs.map((tab) => {
                    const isActive = tab.uid === activeTab.uid && activeVisible;
                    return (
                      <button
                        key={tab.uid ?? tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={triggerClassName(isActive)}
                        onClick={() => onSelectTab(tab.uid)}
                      >
                        {tab.title}
                      </button>
                    );
                  })}
                </div>
                <div className="storefront-preview__panel" role="tabpanel" aria-label={activeTab.title}>
                  {isHidden ? (
                    <div className="storefront-preview__notice storefront-preview__notice--hidden">
                      <strong>Hidden tab</strong>
                      <span>
                        This tab is not shown on the storefront. Content below is for your reference
                        only.
                      </span>
                    </div>
                  ) : null}
                  <PreviewContent content={previewContent} contentType={activeTab.contentType} />
                </div>
              </>
            )}
          </div>

          <s-stack gap="small" className="storefront-preview__meta">
            <s-text type="strong">{activeTab.title}</s-text>
            <s-stack direction="inline" gap="small">
              <s-badge tone={activeTab.contentType === "DYNAMIC" ? "info" : undefined}>
                {activeTab.contentType === "DYNAMIC"
                  ? CONTENT_TYPE_LABELS[CONTENT_TYPE.DYNAMIC]
                  : CONTENT_TYPE_LABELS[CONTENT_TYPE.STATIC]}
              </s-badge>
              <s-badge>{targetingSummaryFromApiTab(activeTab)}</s-badge>
              {activeTab.status === "ACTIVE" ? (
                <s-badge tone="success">Active</s-badge>
              ) : (
                <s-badge tone="neutral">Hidden</s-badge>
              )}
            </s-stack>
          </s-stack>
        </div>
      </aside>
    </s-grid>
  );
}
