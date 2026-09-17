import {
  CONTENT_TYPE,
  CONTENT_TYPE_LABELS,
  EMPTY_BEHAVIOR,
  STATUS,
} from "../../../api/utils/constants.js";
import { getFormContent, targetingSummary } from "../../utils/helper";

export function TabEditorSummaryCard({ tab, previewText }) {
  const content = getFormContent(tab);
  const displayTitle = tab?.title?.trim() || "Untitled tab";
  const summaryLines = [
    CONTENT_TYPE_LABELS[tab?.contentType] ?? "Content",
    targetingSummary(tab ?? {}),
  ];

  if (tab?.contentType === CONTENT_TYPE.STATIC) {
    const text = content.staticContent?.trim();
    summaryLines.push(
      text
        ? `Static content${text.length > 60 ? `: ${text.slice(0, 60)}…` : `: ${text}`}`
        : "No static content yet"
    );
  } else {
    summaryLines.push(`Template: ${previewText || "—"}`);
    summaryLines.push(
      content.emptyBehavior === EMPTY_BEHAVIOR.FALLBACK
        ? "Shows fallback text when metafield is empty"
        : "Hidden when metafield is empty"
    );
  }

  summaryLines.push(
    tab?.status === STATUS.ACTIVE ? "Active on storefront" : "Hidden on storefront"
  );

  return (
    <s-grid background="base" border="base" borderRadius="base" padding="base" gap="base">
      <s-heading>Tab summary</s-heading>
      <s-text type="strong">{displayTitle}</s-text>
      <s-stack gap="small-200">
        {summaryLines.map((line, index) => (
          <s-text key={`${index}-${line}`}>• {line}</s-text>
        ))}
      </s-stack>
    </s-grid>
  );
}

/** Gadget `tab.status` → UI (`active` / `hidden`). */
export function apiTabStatusToUi(apiStatus) {
  if (apiStatus === "ACTIVE") return STATUS.ACTIVE;
  if (apiStatus === "DISABLE") return STATUS.HIDDEN;
  return STATUS.ACTIVE;
}

/**
 * @param tab Gadget tab record from `useFindFirst` (`tabData`) — may be undefined on new tab
 * @param formStatus Draft status from editor state (`tabDataInput.status`, UI values)
 */
export function TabEditorStatusCard({ tab, formStatus, onUpdateField }) {
  const savedStatus = tab ? apiTabStatusToUi(tab.status) : STATUS.ACTIVE;
  const draftStatus = formStatus ?? savedStatus;

  return (
    <s-grid background="base" border="base" borderRadius="base" padding="base" gap="base">
      <s-heading>Status</s-heading>
      <s-stack direction="inline" gap="small" alignItems="center">
        <s-text tone="subdued">Current status:</s-text>
        {savedStatus === STATUS.ACTIVE ? (
          <s-badge tone="success">Active</s-badge>
        ) : (
          <s-badge tone="neutral">Hidden</s-badge>
        )}
      </s-stack>
      <s-choice-list
        label="Visibility on product pages"
        name="tab-editor-status"
        onChange={(e) => {
          const value = e.currentTarget.values?.[0];
          if (value === STATUS.ACTIVE || value === STATUS.HIDDEN) {
            onUpdateField("status", value);
          }
        }}
      >
        <s-choice value={STATUS.ACTIVE} selected={draftStatus === STATUS.ACTIVE}>
          Active
        </s-choice>
        <s-choice value={STATUS.HIDDEN} selected={draftStatus === STATUS.HIDDEN}>
          Hidden
        </s-choice>
      </s-choice-list>
    </s-grid>
  );
}
