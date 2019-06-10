function removeEverything() {
    while (document.body.firstChild) {
        document.body.firstChild.remove();
    }
}

function insertBeast(beastURL) {
    var beastImage = document.createElement("img");
    beastImage.setAttribute("src", beastURL);
    beastImage.setAttribute("style", "width: 100vw");
    beastImage.setAttribute("style", "height: 100vh");
    document.body.appendChild(beastImage);
}

function beastify(request, sender, sendResponse) {
    removeEverything();
    insertBeast(request.beastURL);
    chrome.runtime.onMessage.removeListener(beastify);
}

chrome.runtime.onMessage.addListener(beastify);