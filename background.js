var config = Object();

function restoreOptions() {
  browser.storage.sync.get().then((res) => {
    config = res;
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
browser.storage.onChanged.addListener(restoreOptions);

browser.tabs.onActivated.addListener((activeInfo) =>
  browser.tabs
    .get(activeInfo.tabId)
    .then(function (tabInfo) {
      let selected = tabInfo.cookieStoreId; // id for the current group
      let storesShown = {}; // tracks whether we have seen tabs in this group yet
      let toHide = []; // tabs currently shown which we want to hide
      let hidTab = false; // remember whether any tabs were hidden
      let foreignTabs = []; // tabs to show despite not being in this group
      let currentGroup = []; // tabs in the current group
      console.info(tabInfo);
      browser.tabs
        .query({ currentWindow: true })
        .then((tabs) => {
          if (config.sortTabs)
            tabs = tabs.sort((a, b) => a.lastAccessed - b.lastAccessed);
          for (let tab of tabs) {
            let showMe = false;
            if (tab.cookieStoreId === selected) {
              showMe = true;
              currentGroup.push(tab.id);
            } else if (!(tab.cookieStoreId in storesShown)) {
              storesShown[tab.cookieStoreId] = true;
              showMe = true;
              foreignTabs.push(tab.id);
            }
            if (tab.hidden && showMe)
              browser.tabs.show([tab.id]).catch(() => {});
            if (!tab.hidden && !showMe) {
              browser.tabs.hide([tab.id]).catch(() => {});
              hidTab = true;
            }
          }

          if (config.moveForeignTabs && foreignTabs.length > 0)
            browser.tabs.move(foreignTabs, { index: 0 }).catch(() => {});

          // if we have just switched groups, highlight those in the current group
          if (config.highlightTabs && toHide.length > 0) {
            browser.tabs
              .highlight({
                populate: false,
                tabs: [...Array(tabs.length).keys()].slice(foreignTabs.length),
              })
              .catch(() => {});
          }
        })
        .catch((error) => {
          // problem querying tabs. ignore it.
        });
    })
    .catch((error) => {
      console.info("hmm2");
      console.error(error);
    })
);
