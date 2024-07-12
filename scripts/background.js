// Runs 'scripts/save_document.js' when extension is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['scripts/save_document.js']
    });
    // chrome.action.setBadgeBackgroundColor({
    //     'color': 'green',
    //     'tabId': tab.id
    // });
    chrome.action.setBadgeText({
        'text':"hi",
        'tabId': tab.id
    });
    chrome.action.setIcon({path: "../images/saved.png", tabId: tab.id});
});

// chrome.action.onClicked.addListener(function(tab) {
//     
    
//     // Optionally, you can change it back after some time or based on another event
//     setTimeout(() => {
//         chrome.action.setIcon({path: "images/unsaved.png", tabId: tab.id});
//     }, 1000); // Change the icon back after 1 second
// });