// WARNING: save_document.js has the exact same updateTfIdf copy and pasted. Make sure they are the same always.
async function updateTfIdf(text, url) 
{
    let storage = await chrome.storage.local.get(["documents", "corpusOccurances"]);

    if (!storage.documents || !storage.corpusOccurances) {
        storage.documents = {};
        storage.corpusOccurances = {};
    }

    let counts = {};
    const regex = /\w+/gi
    let words = text.match(regex)

    let bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
        let bigram = words[i].toLowerCase() + " " + words[i + 1].toLowerCase();
        bigrams.push(bigram);
    }
    words = words.concat(bigrams);

    words.forEach(function(tmp) {
        let str = tmp.toLowerCase();
        if (counts[str]) {
            counts[str]++;
        } else {
            counts[str] = 1;
        }
    });

    // Delete saved document
    let removeSavedUrl = false;
    if (url.localeCompare('query') != 0 && storage.documents[url]) {
        removeSavedUrl = true;
        delete storage.documents[url];
        for (let word in counts) {
            storage.corpusOccurances[word]--;
        }
        for (let word in storage.corpusOccurances) {
            if (storage.corpusOccurances[word] === 0) {
                delete storage.corpusOccurances[word];
            }
        }

        // let corpusSize = Object.keys(storage.documents).length;
        // for (let savedUrl in storage.documents) {
        //     if (!storage.documents[savedUrl]["idf"]){
        //         storage.documents[savedUrl]["idf"] = {};
        //     }
        //     for (let str in counts) {
        //         storage.documents[savedUrl]["idf"][str] = Math.log(corpusSize / (storage.corpusOccurances[str]));
        //     };
        // }
    
    
        // for (let savedUrl in storage.documents) {
        //     if (!storage.documents[savedUrl]["tfIdf"]){
        //         storage.documents[savedUrl]["tfIdf"] = {};
        //     }
        //     for (let str in counts) {
        //         storage.documents[savedUrl]["tfIdf"][str] = storage.documents[savedUrl]["tf"][str] * storage.documents[savedUrl]["idf"][str];
        //     };
        // }
        await chrome.storage.local.set({documents:storage.documents, corpusOccurances:storage.corpusOccurances});
        return;
    }

    storage.documents[url] = {};

    let selectedText = window.getSelection().toString();
    storage.documents[url]["st"] = null;
    if (selectedText)
    {
        storage.documents[url]["st"] = selectedText;
    }
    else
    {
        storage.documents[url]["st"] = "";
    }

    let wordCount = words.length;
    storage.documents[url]["tf"] = {};
    for (let str in counts){
        storage.documents[url]["tf"][str] = counts[str] / wordCount;
    }

    let savingQuery = url.localeCompare('query') == 0;


    if (!savingQuery) {
        for (let str in counts) {
            if (storage.corpusOccurances[str]) {
                storage.corpusOccurances[str]++;
            } else {
                storage.corpusOccurances[str] = 1;
            }
        };
    }


    let documentsToIterate = storage.documents;
    if (savingQuery) {
        documentsToIterate = [storage.documents['query']]
    }

    let corpusSize = Object.keys(storage.documents).length + 1; // When one document is saved, all idf scores are 0 normally, +1 prevents this
    for (let savedUrl in documentsToIterate) {
        if (!documentsToIterate[savedUrl]["idf"]){
            documentsToIterate[savedUrl]["idf"] = {};
        }
        for (let str in counts) {
            documentsToIterate[savedUrl]["idf"][str] = Math.log(corpusSize / (storage.corpusOccurances[str]));
        };
    };
    for (let savedUrl in documentsToIterate) {
        if (!documentsToIterate[savedUrl]["tfIdf"]){
            documentsToIterate[savedUrl]["tfIdf"] = {};
        }
        for (let str in counts) {
            documentsToIterate[savedUrl]["tfIdf"][str] = documentsToIterate[savedUrl]["tf"][str] * documentsToIterate[savedUrl]["idf"][str];
        };
    };

    console.log(storage.documents['query']);
    for (let url in storage.documents) {
        console.log(url);
        console.log(storage.documents[url]['idf']['function']);
    }
    console.log(storage.documents);


    

    await chrome.storage.local.set({documents:storage.documents, corpusOccurances:storage.corpusOccurances});

    return storage;
}

// This is very pointless as the query is already being accessed in 
// getReccomendation but this function is used in showReccomendation()
// Remove at first chance
async function setSearchQuery() { 
    const urlObj = new URL(window.location.href);
    const params = new URLSearchParams(urlObj.search);
    const query = params.get('q');
    await chrome.storage.local.set({ query: query});
}

async function getReccomendation() {
    let urlObj = new URL(window.location.href);
    let params = new URLSearchParams(urlObj.search);
    let query = params.get('q');
    let storage = await updateTfIdf(query, "query");
    
    let cosineSimilarities = {};
    let queryTfIdf = storage.documents["query"]["tfIdf"];
    
    for (let url in storage.documents) {
        let documentTfIdf = storage.documents[url]["tfIdf"];
        let productSum = 0;
        let querySquareSum = 0;
        let documentSquareSum = 0;

        for (let word in storage.documents["query"]["tfIdf"]) {
            let documentTfIdfWord = documentTfIdf[word];
            if (!documentTfIdfWord) {
                documentTfIdfWord = 0;
            }
            let queryTfIdfWord = queryTfIdf[word];
            
            productSum += queryTfIdfWord * documentTfIdfWord;
            querySquareSum += queryTfIdfWord * queryTfIdfWord;
            documentSquareSum += documentTfIdfWord * documentTfIdfWord;
        }

        let cosineSimilarity = 0;
        if (querySquareSum != 0 && documentSquareSum != 0){
            cosineSimilarity = (productSum + 0.00000001) / (Math.sqrt(querySquareSum + 0.0001) * Math.sqrt(documentSquareSum + 0.0001));
        } 
        cosineSimilarities[url] = cosineSimilarity;
    }
    console.log(cosineSimilarities);
    let pairs = Object.entries(cosineSimilarities);
    pairs.sort((a, b) => b[1] - a[1]);
    const sortedKeys = pairs.map(pair => pair[0]);

    sortedKeys.splice(sortedKeys.indexOf("query"), 1);
    

    let sortedKeysAndHighlightedTexts = {};
    for (let i = 0; i < sortedKeys.length; i++)
    {
        let url = sortedKeys[i];
        let hlText = storage.documents
        sortedKeysAndHighlightedTexts[url] = storage.documents[url]["st"];
    }
    return sortedKeysAndHighlightedTexts;
}

async function placeReccomendationBoxInDiv(reccomendationBox) {
    // If a google info box appears on the right, a new column with id rhs is created, it takes a short time to load
    searchResults = document.getElementById("rcnt")

    let rhsDiv = null;
    for (let i = 0; i < 2; i++) {  // Try for a maximum of 10 times
        rhsDiv = searchResults.querySelector('#rhs');
        if (rhsDiv) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));  // Wait for 500ms before trying again
    }
    if (rhsDiv) {
        rhsDiv.appendChild(reccomendationBox);
    } else {
        let newRhsDiv = document.createElement('div');
        newRhsDiv.id = 'rhs';
        searchResults.appendChild(newRhsDiv);
        newRhsDiv.appendChild(reccomendationBox);
    }
}



function createReccomendationBox(text) {

    let existing_box = document.getElementById('archive-recommendation');
    if (existing_box != null) { 
        return null;
    }
    var infoBox = document.createElement('div');
    infoBox.className = 'your-info-box-class';
    infoBox.id = 'archive-recommendation'
    infoBox.padding = '15px';

    // Create title section
    var titleSection = document.createElement('div');
    // titleSection.className = 'info-title';
    titleSection.textContent = 'DevArchive Suggestion';
    infoBox.appendChild(titleSection);

    // Add horizontal break
    var hr = document.createElement('hr');
    infoBox.appendChild(hr);

    // Create content section
    var contentSection = document.createElement('div');
    // contentSection.className = 'info-content';
    contentSection.innerHTML = text;
    infoBox.appendChild(contentSection);
    return infoBox;
}

async function showReccomendation() {
    let rankedReccomendations = await getReccomendation();
    var text = ""

    const entries = Object.entries (rankedReccomendations);
    const firstFive = entries.slice (0,5);

    firstFive.forEach (([recommendedUrl, highlightedText]) => {
        
        text += '<p><a href="' + recommendedUrl + '">' + recommendedUrl + "</a></p><p>";

        if (highlightedText)
        {
            text += "- Highlighted text: " + highlightedText;
        }

        text += '</p>' + "\n";

        console.log(recommendedUrl + " text: " + highlightedText);
    });

    let recommendation_box = createReccomendationBox(text);

    if (recommendation_box == null) {
        return;
    }

    await placeReccomendationBoxInDiv(recommendation_box);
}
// urlpattern = /^https:\/\/www\.google\.com\/search.*/
if (/^https:\/\/www\.google\.com\/search.*/.test(window.location.href))
{
    showReccomendation();
}
else
{
    updateTfIdf(document.body.innerText, window.location.href);
}