var config = Object();

/*global browser*/

function restoreOptions() {
  browser.storage.sync.get().then((res) => {
    config = res;
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
browser.storage.onChanged.addListener(restoreOptions);

browser.tabs.onActivated.addListener((activeInfo) =>
  browser.contextualIdentities
    .query({})
    .then((contexts) => {
      let result = {};
      for (let context of contexts) {
        result[context.cookieStoreId] = context.name;
      }
      return result;
    })
    .then((contextNameMap) => {
      browser.tabs
        .get(activeInfo.tabId)
        .then(function (tabInfo) {
          console.log("----");
          console.log(tabInfo);
          let selected = tabInfo.cookieStoreId; // id for the current group
          let storesShown = {}; // tracks whether we have seen tabs in this group yet.
          // value is whether we have already shown the placeholder tab
          let hidSomething = false;
          let toHide = []; // tabs currently shown which we want to hide
          let foreignTabs = []; // tabs to show despite not being in this group
          let currentGroup = []; // tabs in the current group
          browser.tabs
            .query({ currentWindow: true })
            .then((tabs) => {
              if (config.sortTabs)
                tabs = tabs.sort((a, b) => a.lastAccessed - b.lastAccessed);
              for (let tab of tabs) {
                let showMe = false;
                let cxName = contextNameMap[tab.cookieStoreId] || "default";
                let is_placeholder = tab.title === cxName;
                console.log(tab.title + " [" + tab.id + "], " + is_placeholder);
                if (
                  tab.url ===
                    "moz-extension://" +
                      browser.runtime.id.slice(1, -1) +
                      "/placeholder.html" &&
                  tab.title === "?"
                ) {
                  browser.tabs
                    .remove(tab.id)
                    .catch((error) => {
                      console.log(error);
                    })
                    .then(() => console.log("Removing broken placeholder."));
                  continue;
                }
                if (
                  tab.url.startsWith("moz-extension://") &&
                  tab.url.endsWith("/placeholder.html") &&
                  tab.title === "?"
                ) {
                  console.log("Fallback method used to detect placeholder.");
                  browser.tabs.remove(tab.id).catch((error) => {
                    console.log(error);
                  });
                  continue;
                }
                if (tab.cookieStoreId === selected && !is_placeholder) {
                  showMe = true;
                  currentGroup.push(tab.id);
                } else if (tab.cookieStoreId !== selected) {
                  if (!storesShown[tab.cookieStoreId]) {
                    storesShown[tab.cookieStoreId] = false;
                  }
                  if (is_placeholder) {
                    storesShown[tab.cookieStoreId] = true;
                    showMe = true;
                  }
                  foreignTabs.push(tab.id);
                }
                if (tab.hidden && showMe)
                  browser.tabs
                    .show([tab.id])
                    .catch((error) => {
                      console.log(error);
                    })
                    .then(() =>
                      console.log(
                        "Showing " +
                          tab.title +
                          " (" +
                          cxName +
                          ") [" +
                          tab.id +
                          "]"
                      )
                    );
                if (!tab.hidden && !showMe) {
                  if (is_placeholder && tab.id === tabInfo.id) {
                    // we can't hide the currently-selected window, so
                    // we will have to destroy it instead
                    browser.tabs
                      .remove(tab.id)
                      .catch((error) => {
                        console.log(error);
                      })
                      .then(() =>
                        console.log(
                          "Removing " +
                            tab.title +
                            " (" +
                            cxName +
                            ") [" +
                            tab.id +
                            "]"
                        )
                      );
                  } else {
                    hidSomething = true;
                    browser.tabs
                      .hide([tab.id])
                      .catch((error) => {
                        console.log(error);
                      })
                      .then(() =>
                        console.log(
                          "Hiding " +
                            tab.title +
                            " (" +
                            cxName +
                            ") [" +
                            tab.id +
                            "]"
                        )
                      );
                  }
                }
              }

              // are there some tab groups which don't have a placeholder?
              // If so, make them
              for (const cookieStoreId in storesShown) {
                if (!storesShown[cookieStoreId]) {
                  let cxName = contextNameMap[cookieStoreId] || "default";
                  browser.tabs
                    .create({
                      index: 0,
                      title: cxName,
                      discarded: true,
                      url: `/placeholder.html?title=${encodeURIComponent(
                        cxName
                      )}`,
                      cookieStoreId: cookieStoreId,
                    })
                    .then(() => console.log("Created new tab for " + cxName));
                }
              }

              if (
                hidSomething &&
                config.moveForeignTabs &&
                foreignTabs.length > 0
              )
                browser.tabs
                  .move(foreignTabs, { index: 0 })
                  .catch(() => {})
                  .then(() =>
                    console.log("Moved tabs to left: " + foreignTabs)
                  );

              // if we have just switched groups, highlight those in the current group
              if (config.highlightTabs && toHide.length > 0) {
                browser.tabs
                  .highlight({
                    populate: false,
                    tabs: [...Array(tabs.length).keys()].slice(
                      foreignTabs.length
                    ),
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {
              // problem querying tabs. ignore it.
            });
        })
        .catch((error) => {
          console.error(error);
        });
    })
);
