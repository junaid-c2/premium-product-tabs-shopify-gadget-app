import { useCallback, useEffect, useRef, useState } from "react";

function normalizeEditorHtml(html) {
  const raw = html?.trim?.() ?? "";
  if (!raw || raw === "<br>" || raw === "<div><br></div>") return "";
  return html ?? "";
}

function ToolbarButton({ label, disabled, onClick, iconType, children }) {
  return (
    <s-button
      variant="tertiary"
      disabled={disabled}
      accessibilityLabel={label}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {iconType ? <s-icon type={iconType} /> : children}
    </s-button>
  );
}

export function TabRichTextEditor({
  label,
  value,
  onChange,
  details,
  placeholder = "Enter tab content…",
  disabled = false,
}) {
  const editorRef = useRef(null);
  const lastEmittedRef = useRef(value ?? "");
  const [codeMode, setCodeMode] = useState(false);

  useEffect(() => {
    if (codeMode) return;
    const el = editorRef.current;
    if (!el) return;
    const next = value ?? "";
    if (next !== el.innerHTML && next !== lastEmittedRef.current) {
      el.innerHTML = next;
      lastEmittedRef.current = next;
    }
  }, [value, codeMode]);

  const emitChange = useCallback(() => {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML ?? "");
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const runCommand = useCallback(
    (command, arg) => {
      if (disabled || codeMode) return;
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      emitChange();
    },
    [disabled, codeMode, emitChange]
  );

  const addLink = useCallback(() => {
    if (disabled || codeMode) return;
    const url = window.prompt("Link URL");
    if (url?.trim()) runCommand("createLink", url.trim());
  }, [disabled, codeMode, runCommand]);

  const handleCodeModeSwitch = useCallback(
    (checked) => {
      if (checked && !codeMode && editorRef.current) {
        const html = normalizeEditorHtml(editorRef.current.innerHTML ?? "");
        lastEmittedRef.current = html;
        if (html !== (value ?? "")) onChange(html);
      }
      setCodeMode(checked);
    },
    [codeMode, onChange, value]
  );

  const helpText =
    details ??
    (codeMode
      ? "Edit the HTML stored for this tab. Switch off to return to the visual editor."
      : "Formatting is saved as HTML for your storefront theme.");

  return (
    <s-stack gap="small-200">
      <s-text type="strong">{label}</s-text>
      <s-box border="base" borderRadius="base" background="base" padding="none">
        <div className="tab-rich-text-editor">
          <div className="tab-rich-text-editor__toolbar">
            <div className="tab-rich-text-editor__toolbar-row">
              {!codeMode ? (
                <s-stack direction="inline" gap="small-200">
                  <ToolbarButton
                    label="Bold"
                    disabled={disabled}
                    iconType="text-bold"
                    onClick={() => runCommand("bold")}
                  />
                  <ToolbarButton
                    label="Italic"
                    disabled={disabled}
                    iconType="text-italic"
                    onClick={() => runCommand("italic")}
                  />
                  <ToolbarButton
                    label="Underline"
                    disabled={disabled}
                    iconType="text-underline"
                    onClick={() => runCommand("underline")}
                  />
                  <ToolbarButton
                    label="Bulleted list"
                    disabled={disabled}
                    iconType="list-bulleted"
                    onClick={() => runCommand("insertUnorderedList")}
                  />
                  <ToolbarButton
                    label="Numbered list"
                    disabled={disabled}
                    iconType="list-numbered"
                    onClick={() => runCommand("insertOrderedList")}
                  />
                  <ToolbarButton
                    label="Insert link"
                    disabled={disabled}
                    iconType="link"
                    onClick={addLink}
                  />
                  <ToolbarButton
                    label="Remove link"
                    disabled={disabled}
                    onClick={() => runCommand("unlink")}
                  >
                    Unlink
                  </ToolbarButton>
                </s-stack>
              ) : (
                <s-text tone="subdued">HTML</s-text>
              )}
              <s-switch
                label="Show HTML"
                checked={codeMode}
                disabled={disabled}
                onChange={(e) => handleCodeModeSwitch(e.currentTarget.checked)}
              />
            </div>
          </div>
          {codeMode ? (
            <div className="tab-rich-text-editor__code">
              <s-text-area
                labelAccessibilityVisibility="exclusive"
                label={label}
                value={value ?? ""}
                rows={10}
                placeholder="<p>Your HTML…</p>"
                disabled={disabled}
                onInput={(e) => onChange(e.currentTarget.value)}
              />
            </div>
          ) : (
            <div
              ref={editorRef}
              className={
                disabled
                  ? "tab-rich-text-editor__surface tab-rich-text-editor__surface--disabled"
                  : "tab-rich-text-editor__surface"
              }
              contentEditable={disabled ? false : true}
              role="textbox"
              aria-multiline="true"
              aria-label={label}
              data-placeholder={placeholder}
              suppressContentEditableWarning
              onInput={emitChange}
              onBlur={emitChange}
            />
          )}
        </div>
      </s-box>
      {helpText ? <s-text tone="subdued">{helpText}</s-text> : null}
    </s-stack>
  );
}
