/*global browser*/

function saveOptions(e) {
  browser.storage.sync.set({
    moveForeignTabs: document.querySelector("#move-foreign-tabs").value,
    sortTabs: document.querySelector("#sort-tabs").value,
    highlightTabs: document.querySelector("#highlight-tabs").value,
  });
  e.preventDefault();
}

function restoreOptions() {
  browser.storage.sync.get().then((result) => {
    document.querySelector("#move-foreign-tabs").checked =
      result.moveForeignTabs || true;
    document.querySelector("#sort-tabs").checked = result.sortTabs || false;
    document.querySelector("#highlight-tabs").checked =
      result.highlightTabs || false;
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
