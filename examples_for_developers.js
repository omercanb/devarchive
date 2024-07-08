async function setValueInChromeStorage() {
    await chrome.storage.local.set({ test: "something" });
}

async function getValueFromChromeStorage() {
    let result = await chrome.storage.local.get(["test"]);
}

// use https://onecompiler.com/javascript/42hvwsz6f
function getCosineSimilarity() {
    // Standard cosine angle formula from math102
    let a = [0.1,0.2,0.1,0.5];
    let b = [0.7,0.2,0.3,0.6];
    let productSum = 0;
    let aSquareSum = 0;
    let bSquareSum = 0;
    for (let i = 0; i < a.length; i ++) {
        productSum += a[i] * b[i];
        aSquareSum += a[i] * a[i];
        bSquareSum += b[i] * b[i];
    }
    let cosineSimilarity = productSum / (Math.sqrt(aSquareSum) * Math.sqrt(bSquareSum))
    return cosineSimilarity;
}

console.log(getCosineSimilarity())