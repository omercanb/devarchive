console.log('hi2');
chrome.storage.local.get(['documents'], (result) => {
    var currentUrl = document.location.href;
    console.log(result.documents);
    if (result.documents[currentUrl])
    {
        console.log(result.documents[currentUrl]);
        var savedText= result.documents[currentUrl]['st'];
        var highlightedSpan = `<span style="background-color: yellow;">${savedText}</span>`;
        var pageText = document.body.innerHTML;
        var highlightedPageText = pageText.replace(new RegExp(savedText, 'g'), highlightedSpan);
        // var highlightedPageText = pageText.replace(new RegExp('method', 'g'), highlightedSpan);
        document.body.innerHTML = highlightedPageText;
    }
});
