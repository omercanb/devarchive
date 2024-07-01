// Runs 'scripts/save_document.js' when extension is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['scripts/save_document.js']
    });
});