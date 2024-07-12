let urls = []

chrome.storage.onChanged.addListener((changes, area) => {
    urls = Object.keys(changes.documents.newValue);
    updateBadge();
})

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['scripts/content.js'],
    });
    updateBadge();
    console.log(urls);
});


function getTabBadgeAndColor(url) { 
    if (/^https:\/\/www\.google\.com\/search.*/.test(url)){
        return ["?", "white"]; 
    } else if (urls.includes(url)) {
        return ["✓", "green"]; 
    } else {
        return ["-", "gray"];
    }

}

function updateBadge() {
    chrome.tabs.query(
        {currentWindow: true, active : true},
        function(tabArray) {
            let activeTab = tabArray[0];
            let pair = getTabBadgeAndColor(activeTab.url);
            let text = pair[0];
            let color = pair[1];
            chrome.action.setBadgeText(
                {
                    text: text,
                    tabId: activeTab.tabId,
                });
            chrome.action.setBadgeBackgroundColor(
                {
                    color: color,
                    tabId: activeTab.tabId,
                }
            )
            console.log(text);
            console.log(color);
        }
    )
}

chrome.tabs.onActivated.addListener(updateBadge);
chrome.tabs.onUpdated.addListener(updateBadge);
// chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
// chrome.action.setBadgeText({'text':"hi"});
// let storage = chrome.storage.local.get(["documents"]);
// console.log(storage)