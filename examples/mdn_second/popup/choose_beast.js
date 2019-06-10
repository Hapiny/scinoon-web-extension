function beastNameToURL(beastName) {
    switch (beastName) {
        case "Frog":
            return chrome.extension.getURL("beasts/frog.jpg");
        case "Snake":
            return chrome.extension.getURL("beasts/snake.jpg");
        case "Turtle":
            return chrome.extension.getURL("beasts/turtle.jpg");
    }
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("beast")) {
        var chosenBeast = e.target.textContent;
        var chosenBeastURL = beastNameToURL(chosenBeast);
    
        chrome.tabs.executeScript(null, { 
            file: "/content_scripts/beastify.js" 
        });
    
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {beastURL: chosenBeastURL});
        });
    }
    else if (e.target.classList.contains("clear")) {
        chrome.tabs.reload();
        window.close();
    }
});