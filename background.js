browser.tabs.onActivated.addListener((activeInfo) =>
  browser.tabs.get(activeInfo.tabId).then(function (tabInfo) {
    let selected = tabInfo.cookieStoreId; // id for the current group
    let storesShown = {}; // tracks whether we have seen tabs in this group yet
    let toShow = []; // tabs currently hidden which we want to show
    let toHide = []; // tabs currently shown which we want to hide
    let foreignTabs = []; // tabs to show despite not being in this group
    let currentGroup = []; // tabs in the current group
    browser.tabs.query({ currentWindow: true }).then((tabs) => {
      for (let tab of tabs.sort((a, b) => a.lastAccessed - b.lastAccessed)) {
        let showMe = false;
        if (tab.cookieStoreId === selected) {
          showMe = true;
          currentGroup.push(tab.id);
        } else if (!(tab.cookieStoreId in storesShown)) {
          storesShown[tab.cookieStoreId] = true;
          showMe = true;
          foreignTabs.push(tab.id);
        }
        if (tab.hidden && showMe) toShow.push(tab.id);
        if (!tab.hidden && !showMe) toHide.push(tab.id);
      }
      if (toShow.length > 0) browser.tabs.show(toShow);
      if (toHide.length > 0) browser.tabs.hide(toHide);

      // if there are multiple tab groups, push the "others" to the left
      if (foreignTabs.length > 0) browser.tabs.move(foreignTabs, { index: 0 });

      // if we have just switched groups, highlight those in the current group
      if (toHide.length > 0) {
        browser.tabs.highlight({
          populate: false,
          tabs: [...Array(tabs.length).keys()].slice(foreignTabs.length),
        });
      }
    });
  })
);
