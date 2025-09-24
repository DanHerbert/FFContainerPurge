async function purgeBrowserData(message, resolve, reject, sendResponse) {
  console.debug("removalOptions: ", message.removalOptions);
  console.debug("dataTypes: ", message.dataTypes);
  try {
    console.time("Removing browsing data");
    console.info("about to call browsingData.remove(...)");
    await browser.browsingData.remove(
      message.removalOptions,
      message.dataTypes
    );
    console.info("successfully called browsingData.remove(...)");
    console.timeEnd("Removing browsing data");
  } catch (err) {
    console.error("Purge failed.");
    console.error(err);
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message != null && message.action === "purge") {
    purgeBrowserData(message);
  }
});
