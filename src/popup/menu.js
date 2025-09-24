const $qs = document.querySelector.bind(document);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadSettings() {
  browser.storage.local
    .get("purgeSettings")
    .then((result) => {
      if (
        result == null ||
        Object.keys(result).length === 0 ||
        Object.keys(result.purgeSettings).length === 0
      ) {
        return;
      }
      const settings = result.purgeSettings;
      $qs("#history-checkbox").checked = settings.history;
      $qs("#cookies-checkbox").checked = settings.cookies;
      $qs("#local-storage-checkbox").checked = settings.localStorage;
    })
    .catch((err) => console.error(err));
}

async function saveSettings() {
  const settings = {
    history: $qs("#history-checkbox").checked,
    cookies: $qs("#cookies-checkbox").checked,
    localStorage: $qs("#local-storage-checkbox").checked,
  };
  try {
    await browser.storage.local.set({ purgeSettings: settings });
  } catch (err) {
    console.error(err);
  }
}

function loadCookieCount() {
  browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    const activeTab = tabs[0];
    const cookieStoreId = activeTab.cookieStoreId;
    browser.cookies.getAll({ storeId: cookieStoreId }).then((cookies) => {
      const label = $qs("#cookies-checkbox + .purge-option-label-text");
      label.innerText = `Include ${cookies.length} Cookies`;
    });
  });
}

async function showConfirmation(cookieStoreId) {
  let ctxId = {};
  try{
    // Don't attempt for default container; API throws an exception if called.
    if (cookieStoreId !== 'firefox-default') {
      ctxId = await browser.contextualIdentities.get(cookieStoreId);
    }
  } catch (err) {
    console.error(err);
  }
  $qs("#cookieStoreId").value = cookieStoreId;
  const checkboxes = document.querySelectorAll(".purge-option-checkbox");
  const thingsToPurge = [];
  for (let checkbox of checkboxes) {
    if (checkbox.checked) {
      thingsToPurge.push(checkbox.name);
    }
  }
  if (thingsToPurge.length > 1) {
    const lastItem = thingsToPurge[thingsToPurge.length - 1];
    thingsToPurge[thingsToPurge.length - 1] = `and ${lastItem}`;
  }
  let selectedItemsFormatted;
  if (thingsToPurge.length > 2) {
    selectedItemsFormatted = thingsToPurge.join(", ");
  } else {
    selectedItemsFormatted = thingsToPurge.join(" ");
  }
  $qs(".selected-items").innerText = selectedItemsFormatted;
  const ctxWrapper = $qs(".contextual-identities");
  const ctxIcon = $qs(".ctx-icon");
  const ctxName = $qs(".ctx-name");
  if ("iconUrl" in ctxId) {
    $qs("#cookieStoreId").value = ctxId.cookieStoreId;
    ctxIcon.classList.remove("hidden");
    ctxWrapper.style.borderBottomColor = `${ctxId.colorCode}`;
    ctxIcon.style.maskImage = `url('${ctxId.iconUrl}')`;
    ctxIcon.style.backgroundColor = `${ctxId.colorCode}`;
    ctxName.innerText = ctxId.name;
  } else {
    ctxIcon.classList.add("hidden");
    ctxName.innerText = "Default";
  }
  $qs('#confirm').disabled = true;
  document.documentElement.classList.add("confirmation");
  await delay(1250);
  $qs('#confirm').disabled = false;
}

async function handlePurgeClick() {
  try {
    const tabs = await browser.tabs.query({
      currentWindow: true,
      active: true,
    });
    const activeTab = tabs[0];
    await showConfirmation(activeTab.cookieStoreId);
  } catch (err) {
    await showConfirmation(err);
  }
}

async function handlePurgeConfirmClick() {
  const cookieStoreId = $qs("#cookieStoreId").value;
  const removalOptions = { cookieStoreId };
  const dataTypes = {
    history: $qs("#history-checkbox").checked,
    cookies: $qs("#cookies-checkbox").checked,
    indexedDB: $qs("#local-storage-checkbox").checked,
    localStorage: $qs("#local-storage-checkbox").checked,
  };
  document.documentElement.classList.add("busy");
  $qs("#cancel").disabled = true;
  try {
    await browser.runtime.sendMessage({
      action: "purge",
      removalOptions,
      dataTypes,
    });
  } catch (err) {
    console.error(err);
  } finally {
    $qs("#cancel").disabled = false;
    document.documentElement.classList.remove("confirmation");
    document.documentElement.classList.remove("busy");
    window.close();
  }
}

function handleClicks(evt) {
  const allowedClickTargets = ["BUTTON", "INPUT"];
  if (!allowedClickTargets.some((tag) => tag === evt.target.tagName)) {
    return;
  }
  if (
    !evt.target.closest("#popup-content") &&
    !evt.target.closest("#confirmation-content")
  ) {
    return;
  }
  if (evt.target.id === "cancel") {
    document.documentElement.classList.remove("confirmation");
    window.close();
  } else if (evt.target.id === "purge") {
    handlePurgeClick();
  } else if (evt.target.id === "confirm") {
    handlePurgeConfirmClick();
  } else if (evt.target.classList.contains("purge-option-checkbox")) {
    saveSettings();
  }
}

loadSettings();
loadCookieCount();
document.addEventListener("click", handleClicks);
