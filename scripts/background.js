let urls = []

chrome.runtime.onInstalled.addListener(() => {
    updateContextMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveURLAndText")
    {
        if (info.selectionText)
        {
            let text = info.selectionText;
            chrome.storage.local.set ({ savedText: text }, () => {
                console.log ('Text saved:', text);
            });
            executeExtension(tab);
        }
    }
    else if (info.menuItemId === "saveURL" || info.menuItemId === "removeURL")
    {
        executeExtension(tab);
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    urls = Object.keys(changes.documents.newValue);
    updateContextMenu();
    updateBadge();
})

chrome.action.onClicked.addListener((tab) => {
    executeExtension(tab);
});

function updateContextMenu() 
{
    chrome.tabs.query(
        {currentWindow: true, active : true},
        function(tabArray) 
        {
            let activeTab = tabArray[0];
            let url = activeTab.url;
            
            chrome.contextMenus.removeAll(() => {
                if (/^https:\/\/www\.google\.com\/search.*/.test(url))
                {
                    return;
                }
                else if (urls.includes(url))
                {
                    chrome.contextMenus.create({
                        id: "removeURL",
                        title: "Remove this tab from DevArchive",
                        contexts: ["all"]
                    });
                }
                else
                {
                    chrome.contextMenus.create({
                        id: "saveURLAndText",
                        title: "Save this tab with the selected text to DevArchive",
                        contexts: ["selection"]
                    });
                
                    chrome.contextMenus.create({
                        id: "saveURL",
                        title: "Save this tab to DevArchive",
                        contexts: ["page", "frame", "link", "editable", "image", "video", "audio"]
                    });
                }
            });
        }
    );
}

function executeExtension(tab)
{
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['scripts/content.js'],
    });
    updateContextMenu();
    updateBadge();
    console.log(urls);
}


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

chrome.tabs.onActivated.addListener(() => {
    updateContextMenu();
    updateBadge();
});

chrome.tabs.onUpdated.addListener(() => {
    updateContextMenu();
    updateBadge();
});
// chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
// chrome.action.setBadgeText({'text':"hi"});
// let storage = chrome.storage.local.get(["documents"]);
// console.log(storage)