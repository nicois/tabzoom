var cakeNotification = "zoom-notification";

browser.tabs.onActivated.addListener((activeInfo) =>
  browser.tabs.get(activeInfo.tabId).then(function (tabInfo) {
    let selected = tabInfo.cookieStoreId; // id for the current group
    let storesShown = {}; // tracks whether we have seen tabs in this group yet
    let toShow = []; // tabs currently hidden which we want to show
    let toHide = []; // tabs currently shown which we want to hide
    let foreignTabs = []; // tabs to show despite not being in this group
    let currentGroup = []; // tabs in the current group
    browser.tabs.query({ currentWindow: true }).then((tabs) => {
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
        if (tab.hidden && showMe) toShow.push(tab.id);
        if (!tab.hidden && !showMe) toHide.push(tab.id);
      }
      console.log(toShow);
      console.log(toHide);

      if (toShow.length > 0) browser.tabs.show(toShow);
      if (toHide.length > 0) browser.tabs.hide(toHide);
      if (foreignTabs.length > 0) browser.tabs.move(foreignTabs, { index: 0 });
      // toHide can only be nonempty if we are switching to a new group (or we have just loaded)
      if (toHide.length > 0) {
        browser.tabs.highlight({
          populate: false,
          tabs: [...Array(tabs.length).keys()].slice(foreignTabs.length),
        });
      }
    });
  })
);

browser.commands.onCommand.addListener(function (command) {
  if (command === "zoom-out") {
    window.console.log("zooming out");
    browser.notifications.create(cakeNotification, {
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/zoom-96.png"),
      title: "zooming out",
      message: "Something something cake",
    });
  }
});

browser.browserAction.onClicked.addListener(() => {
  var clearing = browser.notifications.clear(cakeNotification);
  clearing.then(() => {
    console.log("cleared");
  });
});
