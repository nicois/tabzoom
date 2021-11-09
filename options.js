var config = Object();

function saveOptions(e) {
  browser.storage.sync.set(
    {
      moveForeignTabs: document.querySelector("#move-foreign-tabs").value,
      sortTabs: document.querySelector("#sort-tabs").value,
      highlightTabs: document.querySelector("#highlight-tabs").value,
    },
    restoreOptions
  );
  e.preventDefault();
}

function restoreOptions() {
  browser.storage.sync.get("colour").then((res) => {
    config = res;
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
