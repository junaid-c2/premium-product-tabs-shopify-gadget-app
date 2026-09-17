(function () {
  var DISPLAY_ACCORDIONS = "accordions";
  var TAB_STYLE_FILLED = "filled";

  function applyTabConfigStyles(mount, tabConfigs) {
    if (!tabConfigs || !mount) return;
    var colors = tabConfigs.colors || {};
    var layout = tabConfigs.layout || {};
    var typography = tabConfigs.typography || {};
    var header = typography.header || typography;
    var body = typography.body || typography;

    mount.style.setProperty("--ppt-tab-text", colors.textColor || "#6D7175");
    mount.style.setProperty("--ppt-tab-bg", colors.backgroundColor || "transparent");
    mount.style.setProperty("--ppt-tab-border", colors.borderColor || "#E1E3E5");
    mount.style.setProperty("--ppt-tab-hover-text", colors.hoverTextColor || "#202223");
    mount.style.setProperty("--ppt-tab-hover-bg", colors.hoverBackgroundColor || "#F6F6F7");
    mount.style.setProperty("--ppt-tab-hover-border", colors.hoverBorderColor || "transparent");
    mount.style.setProperty("--ppt-tab-active-text", colors.activeTextColor || "#202223");
    mount.style.setProperty("--ppt-tab-active-bg", colors.activeBackgroundColor || "transparent");
    mount.style.setProperty("--ppt-tab-active-border", colors.activeBorderColor || "#202223");
    mount.style.setProperty("--ppt-tab-bar-divider", layout.tabBarDividerColor || "#E1E3E5");
    mount.style.setProperty("--ppt-tab-underline-width", (layout.underlineWidth ?? 2) + "px");
    mount.style.setProperty("--ppt-tab-radius", (layout.borderRadius ?? 0) + "px");
    mount.style.setProperty("--ppt-tab-border-width", (layout.borderWidth ?? 1) + "px");
    mount.style.setProperty("--ppt-tabs-header-gap", (layout.tabsHeaderGap ?? 4) + "px");
    mount.style.setProperty(
      "--ppt-accordions-item-gap",
      (layout.accordionsItemGap ?? 8) + "px"
    );
    mount.style.setProperty(
      "--ppt-tabs-header-border-width",
      (layout.tabsHeaderBorderWidth ?? layout.borderWidth ?? 1) + "px"
    );
    mount.style.setProperty(
      "--ppt-tabs-header-border-radius",
      (layout.tabsHeaderBorderRadius ?? layout.borderRadius ?? 0) + "px"
    );
    mount.style.setProperty(
      "--ppt-tabs-header-border",
      colors.tabsHeaderBorderColor || colors.borderColor || "#D9C9C9"
    );
    mount.style.setProperty(
      "--ppt-accordions-header-border-width",
      (layout.accordionsHeaderBorderWidth ?? layout.borderWidth ?? 1) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-header-border-radius",
      (layout.accordionsHeaderBorderRadius ?? 8) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-header-border",
      colors.accordionsHeaderBorderColor || colors.borderColor || "#E1E3E5"
    );
    mount.style.setProperty(
      "--ppt-tabs-header-body-gap",
      (layout.tabsHeaderBodyGap ?? 12) + "px"
    );
    mount.style.setProperty(
      "--ppt-tabs-body-border-width",
      (layout.tabsBodyBorderWidth ?? 0) + "px"
    );
    mount.style.setProperty(
      "--ppt-tabs-body-border-radius",
      (layout.tabsBodyBorderRadius ?? 8) + "px"
    );
    mount.style.setProperty(
      "--ppt-tabs-container-padding",
      (layout.tabsContainerPadding ?? 0) + "px"
    );
    mount.style.setProperty("--ppt-tabs-body-padding", (layout.tabsBodyPadding ?? 12) + "px");
    mount.style.setProperty(
      "--ppt-tabs-body-border",
      colors.tabsBodyBorderColor || "#E1E3E5"
    );
    mount.style.setProperty(
      "--ppt-tabs-body-bg",
      colors.tabsBodyBackgroundColor || "transparent"
    );
    mount.style.setProperty(
      "--ppt-accordions-header-body-gap",
      (layout.accordionsHeaderBodyGap ?? 12) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-body-border-width",
      (layout.accordionsBodyBorderWidth ?? 0) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-body-border-radius",
      (layout.accordionsBodyBorderRadius ?? 8) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-container-padding",
      (layout.accordionsContainerPadding ?? 0) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-body-padding",
      (layout.accordionsBodyPadding ?? 12) + "px"
    );
    mount.style.setProperty(
      "--ppt-accordions-body-border",
      colors.accordionsBodyBorderColor || "#E1E3E5"
    );
    mount.style.setProperty(
      "--ppt-accordions-body-bg",
      colors.accordionsBodyBackgroundColor || "transparent"
    );
    mount.style.setProperty(
      "--ppt-header-font-size",
      (header.fontSize != null ? header.fontSize : 14) + "px"
    );
    mount.style.setProperty("--ppt-header-font-family", header.fontFamily || "inherit");
    mount.style.setProperty("--ppt-header-font-weight", header.fontWeight || "400");
    mount.style.setProperty("--ppt-header-font-style", header.fontStyle || "normal");
    mount.style.setProperty(
      "--ppt-body-font-size",
      (body.fontSize != null ? body.fontSize : 14) + "px"
    );
    mount.style.setProperty("--ppt-body-font-family", body.fontFamily || "inherit");
    mount.style.setProperty("--ppt-body-font-weight", body.fontWeight || "400");
    mount.style.setProperty("--ppt-body-font-style", body.fontStyle || "normal");
  }

  function setRootLayoutClass(mount, tabConfigs) {
    mount.classList.remove(
      "premium-product-tabs--accordions",
      "premium-product-tabs--underline",
      "premium-product-tabs--filled"
    );
    var configs = tabConfigs || {};
    if (configs.displayType === DISPLAY_ACCORDIONS) {
      mount.classList.add("premium-product-tabs--accordions");
    } else if (configs.tabStyle === TAB_STYLE_FILLED) {
      mount.classList.add("premium-product-tabs--filled");
    } else {
      mount.classList.add("premium-product-tabs--underline");
    }
  }

  function getShadowMount(host) {
    return host.shadowRoot && host.shadowRoot.querySelector("[data-premium-product-tabs-mount]");
  }

  /**
   * Inline CSS in shadow root (fetch) so styles apply before first paint — avoids FOUC from async <link>.
   */
  function loadStylesIntoShadow(shadow, sheetUrl) {
    if (shadow.querySelector("style[data-ppt-styles]")) {
      return Promise.resolve();
    }
    if (!sheetUrl) return Promise.resolve();

    return fetch(sheetUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("stylesheet fetch failed");
        return res.text();
      })
      .then(function (css) {
        var style = document.createElement("style");
        style.setAttribute("data-ppt-styles", "");
        style.textContent = css;
        shadow.insertBefore(style, shadow.firstChild);
      })
      .catch(function () {
        return new Promise(function (resolve) {
          var link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = sheetUrl;
          link.setAttribute("data-ppt-styles", "");
          link.onload = function () {
            resolve();
          };
          link.onerror = function () {
            resolve();
          };
          shadow.insertBefore(link, shadow.firstChild);
        });
      });
  }

  /**
   * Shadow DOM keeps theme CSS from affecting tabs/accordions or tab body HTML.
   */
  function prepareShadowMount(host) {
    var existing = getShadowMount(host);
    if (existing) return Promise.resolve({ mount: existing, bootStyle: null });

    var shadow = host.attachShadow({ mode: "open" });
    var bootStyle = document.createElement("style");
    bootStyle.setAttribute("data-ppt-boot", "");
    bootStyle.textContent = ":host{visibility:hidden!important}";
    shadow.appendChild(bootStyle);

    var sheetUrl = host.getAttribute("data-stylesheet-url");
    return loadStylesIntoShadow(shadow, sheetUrl).then(function () {
      var mount = document.createElement("div");
      mount.className = "premium-product-tabs";
      mount.setAttribute("data-premium-product-tabs-mount", "");
      shadow.appendChild(mount);
      return { mount: mount, bootStyle: bootStyle };
    });
  }

  function revealShadowHost(host, bootStyle) {
    if (bootStyle && bootStyle.parentNode) bootStyle.remove();
    host.style.visibility = "visible";
  }

  var CHEVRON_DOWN_PATH = "M6 8.5l4 4 4-4";
  var CHEVRON_UP_PATH = "M6 11.5l4-4 4 4";

  function setChevronExpanded(svg, expanded) {
    var path = svg.querySelector("path");
    if (path) path.setAttribute("d", expanded ? CHEVRON_UP_PATH : CHEVRON_DOWN_PATH);
  }

  /** Matches admin preview (`s-icon` chevron-up / chevron-down). */
  function createChevronIcon(expanded) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute(
      "class",
      "premium-product-tabs__accordion-icon premium-product-tabs__accordion-trigger-icon"
    );
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.75");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", expanded ? CHEVRON_UP_PATH : CHEVRON_DOWN_PATH);
    svg.appendChild(path);
    return svg;
  }

  function renderTabs(host, mount, data) {
    var tabs = data.tabs || [];
    var blockId = host.dataset.blockId || "ppt";

    if (!tabs.length) {
      host.hidden = true;
      return;
    }

    host.hidden = false;
    applyTabConfigStyles(mount, data.tabConfigs);
    setRootLayoutClass(mount, data.tabConfigs);

    var bar = document.createElement("div");
    bar.className = "premium-product-tabs__bar";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Product tabs");

    var panels = document.createElement("div");
    panels.className = "premium-product-tabs__panels";

    tabs.forEach(function (tab, index) {
      var tabId = "ppt-tab-" + blockId + "-" + tab.uid;
      var panelId = "ppt-panel-" + blockId + "-" + tab.uid;

      var button = document.createElement("button");
      button.type = "button";
      button.className = "premium-product-tabs__tab";
      button.id = tabId;
      button.textContent = tab.title || "Tab";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panelId);
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      if (index === 0) button.classList.add("premium-product-tabs__tab--active");

      var panel = document.createElement("div");
      panel.className = "premium-product-tabs__panel premium-product-tabs__content";
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);
      panel.hidden = index !== 0;
      panel.innerHTML = tab.bodyHtml || "";

      button.addEventListener("click", function () {
        bar.querySelectorAll(".premium-product-tabs__tab").forEach(function (el) {
          el.classList.remove("premium-product-tabs__tab--active");
          el.setAttribute("aria-selected", "false");
        });
        panels.querySelectorAll(".premium-product-tabs__panel").forEach(function (el) {
          el.hidden = true;
        });
        button.classList.add("premium-product-tabs__tab--active");
        button.setAttribute("aria-selected", "true");
        panel.hidden = false;
      });

      bar.appendChild(button);
      panels.appendChild(panel);
    });

    mount.replaceChildren(bar, panels);
  }

  function renderAccordions(host, mount, data) {
    var tabs = data.tabs || [];
    var blockId = host.dataset.blockId || "ppt";

    if (!tabs.length) {
      host.hidden = true;
      return;
    }

    host.hidden = false;
    applyTabConfigStyles(mount, data.tabConfigs);
    setRootLayoutClass(mount, data.tabConfigs);

    var accordion = document.createElement("div");
    accordion.className = "premium-product-tabs__accordion";

    var items = [];

    tabs.forEach(function (tab, index) {
      var triggerId = "ppt-acc-trigger-" + blockId + "-" + tab.uid;
      var panelId = "ppt-acc-panel-" + blockId + "-" + tab.uid;
      var isOpen = index === 0;

      var item = document.createElement("div");
      item.className = "premium-product-tabs__accordion-item";
      if (isOpen) item.classList.add("premium-product-tabs__accordion-item--open");

      var button = document.createElement("button");
      button.type = "button";
      button.className = "premium-product-tabs__accordion-trigger";
      button.id = triggerId;
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      button.setAttribute("aria-controls", panelId);

      var label = document.createElement("span");
      label.className = "premium-product-tabs__accordion-trigger-label";
      label.textContent = tab.title || "Tab";

      button.appendChild(label);
      var chevronIcon = createChevronIcon(isOpen);
      button.appendChild(chevronIcon);

      var panel = document.createElement("div");
      panel.className = "premium-product-tabs__accordion-panel premium-product-tabs__content";
      panel.id = panelId;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", triggerId);
      panel.hidden = !isOpen;
      panel.innerHTML = tab.bodyHtml || "";

      function setOpen(open) {
        item.classList.toggle("premium-product-tabs__accordion-item--open", open);
        button.setAttribute("aria-expanded", open ? "true" : "false");
        button.classList.toggle("premium-product-tabs__accordion-trigger--active", open);
        setChevronExpanded(chevronIcon, open);
        panel.hidden = !open;
      }

      button.addEventListener("click", function () {
        var wasOpen = !panel.hidden;
        items.forEach(function (entry) {
          entry.setOpen(false);
        });
        if (!wasOpen) setOpen(true);
      });

      if (isOpen) button.classList.add("premium-product-tabs__accordion-trigger--active");

      item.appendChild(button);
      item.appendChild(panel);
      accordion.appendChild(item);

      items.push({ setOpen: setOpen });
    });

    mount.replaceChildren(accordion);
  }

  function parseTabsJson(text) {
    var cleaned = text.replace(/<!--[\s\S]*?-->/g, "").trim();
    var start = cleaned.indexOf("{");
    var end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new SyntaxError("No JSON object found");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  function initRoot(host) {
    var script = host.querySelector("[data-premium-product-tabs-json]");
    if (!script) return;

    var data;
    try {
      data = parseTabsJson(script.textContent);
    } catch (e) {
      console.warn("[premium-product-tabs] Invalid JSON", e);
      return;
    }

    script.remove();

    if (data.isPlanSubscribed !== true) {
      host.hidden = true;
      return;
    }

    prepareShadowMount(host).then(function (ctx) {
      var mount = ctx.mount;
      var displayType = data.tabConfigs && data.tabConfigs.displayType;
      if (displayType === DISPLAY_ACCORDIONS) {
        renderAccordions(host, mount, data);
      } else {
        renderTabs(host, mount, data);
      }
      revealShadowHost(host, ctx.bootStyle);
    });
  }

  document.querySelectorAll("[data-premium-product-tabs-root]").forEach(initRoot);
})();
