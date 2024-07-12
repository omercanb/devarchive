// WARNING: content.js has the exact same updateTfIdf copy and pasted. Make sure they are the same always.
async function updateTfIdf(text, url) 
{
    let storage = await chrome.storage.local.get(["documents", "corpusOccurances"]);

    if (!storage.documents || !storage.corpusOccurances) {
        storage.documents = {};
        storage.corpusOccurances = {};
    }

    let alreadySaved = false;
    if (storage.documents[url]) {
        alreadySaved = true;
    }
    
    storage.documents[url] = {};

    let counts = {};
    const regex = /\w+/gi;
    let words = text.match(regex);
    let bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
        let bigram = words[i].toLowerCase() + " " + words[i + 1].toLowerCase();
        bigrams.push(bigram);
    }
    
    bigrams.forEach(function(bigram) {
        if (counts[bigram]) {
            counts[bigram]++;
        } else {
            counts[bigram] = 1;
        }
    });

    let bigramCount = bigrams.length;
    storage.documents[url]["tf"] = {};
    for (let bigram in counts){
        storage.documents[url]["tf"][bigram] = counts[bigram] / bigramCount;
    }

    if (!alreadySaved) {
        for (let bigram in counts) {
            if (storage.corpusOccurances[bigram]) {
                storage.corpusOccurances[bigram]++;
            } else {
                storage.corpusOccurances[bigram] = 1;
            }
        };
    }

    let corpusSize = Object.keys(storage.documents).length + 1; // Count including current document
    for (let savedUrl in storage.documents) {
        if (!storage.documents[savedUrl]["idf"]){
            storage.documents[savedUrl]["idf"] = {};
        }
        for (let bigram in counts) {
            storage.documents[savedUrl]["idf"][bigram] = Math.log(corpusSize / (1 + storage.corpusOccurances[bigram]));
        };
    }

    for (let savedUrl in storage.documents) {
        if (!storage.documents[savedUrl]["tfIdf"]){
            storage.documents[savedUrl]["tfIdf"] = {};
        }
        for (let bigram in counts) {
            storage.documents[savedUrl]["tfIdf"][bigram] = storage.documents[savedUrl]["tf"][bigram] * storage.documents[savedUrl]["idf"][bigram];
        };
    }

    await chrome.storage.local.set({documents:storage.documents, corpusOccurances:storage.corpusOccurances});

    return storage;
}

chrome.storage.local.set({ title: document.title });
updateTfIdf(document.body.innerText, window.location.href);
