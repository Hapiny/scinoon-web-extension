let $ = window.$.noConflict(true);
let hostname = window.location.hostname;

if (hostname.search("google") !== -1) {
    var scholar = scholars.google;
} else if (hostname.search("semantic") !== -1) {
    var scholar = scholars.semantic;
}

let waitPageLoading = false;
let baseLink = `http://${hostname}${scholar.searchPath}`;
let searchString = scholar.getSearchString();

function injectLocalCss() {
	var scholarCssLink = $("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: browser.runtime.getURL('scholar_styles.css')
    });
    scholarCssLink.appendTo("head");
};

function parseSearchResult() {
    let articles = extractor.extract(document);
	browser.runtime.sendMessage({
	    name: messages.RETURN_EXTRACTED,
	    data: {
	    	url : window.location.href,
	    	articles : articles
	    }
	});
};

function createTermsPanel() {
	var termsPanel = document.createElement('div');
    termsPanel.className = "scholar_terms_panel";
    
	var titleBox = document.createElement('div');
	var panelTitle = document.createElement('p');
	panelTitle.innerHTML = "<center><h3>Terms from current research</h3></center>";
	titleBox.appendChild(panelTitle);
	termsPanel.appendChild(titleBox);
    
    var termsBox = document.createElement('div');
	termsBox.id = "termsBox";
	termsBox.className = "scholar_terms_box";
    
    var researchTermsBox = document.createElement('div');
	researchTermsBox.id = "researchTermsBox";
    
    var clustersTermsBox = document.createElement('div');
	clustersTermsBox.id = "clustersTermsBox";
	
	termsBox.appendChild(researchTermsBox);
	termsBox.appendChild(clustersTermsBox);
	termsPanel.appendChild(termsBox);
    
    document.body.appendChild(termsPanel);
}

function addTermsTitle(text, termsBox) {
	var title = document.createElement('p');
	title.innerHTML = `<center><h4>${text}</h4></center>`;
	termsBox.appendChild(title);
}

function addTermToList(term, termsList) {
	var li = document.createElement('li');
	li.innerHTML = 
		`<span>
			<a href='${baseLink + searchString + "+" + term}'>
				<img src='${browser.extension.getURL("/icons/add.png")}' alt='+' style='vertical-align: -25%'/>
			</a>
			&nbsp;
			<span class='term_text'>
				<a href='http://${hostname}${scholar.searchPath}${term}'>${term}</a>
			</span>
		</span>`;
	li.className = "term_list_item";
	termsList.appendChild(li);
}

function addTermsGroup(name, terms, termsBox) {
	var termsList = document.createElement('ul');
	termsList.className = "terms_list";
	addTermsTitle(name, termsBox);
	if (terms.length == 0) {
		var label = document.createElement('p');
		label.innerHTML = "<center><font size=2>There are no extracted terms for this group</font></center>";
		termsBox.appendChild(label);
	} else {
		for (let term of terms) {
			addTermToList(term, termsList);
		}
		termsBox.appendChild(termsList);
	}
	
}

function handleExtractedTermsResearch(message) {
	let termsBox = document.getElementById('researchTermsBox');
	addTermsGroup('Common terms', message.data, termsBox);
}

function handleExtractedTermsClusters(message) {
	let termsBox = document.getElementById('clustersTermsBox');
	let clusterWithTermsList = message.data;
	for (let clusterWithTerms of clusterWithTermsList) {
		addTermsGroup(clusterWithTerms.clName, clusterWithTerms.terms, termsBox);
	}
}

function handleNormalizedData(message) {
    function setAdded(button) {
		button.textContent = "Added!"
		button.disabled = true;
    }
    
    var normalizedArticlesStatus = message.data;
    var articleBlocks = $(scholar.articleBlocksSelector);

    for (var index = 0; index < normalizedArticlesStatus.length; ++index) {
        var articleStatus = normalizedArticlesStatus[index];
        var articleId = articleStatus["article"]["id"];
        
        if (articleId.sourceName === scholar.articleSourceName) {
            let scholarId = articleId.privateId;
            let blockFilter = scholar.getBlockFilter(scholarId);

            let articleBlock = articleBlocks.has(blockFilter);
	        let button = $("<button>", {
	            id: `add_to_rm_${scholarId}`,
	            type: "button",
	            class: "add_to_rm_button",
	            text: "Add to research map"
            });
            
            if (articleStatus["isExist"]) {
	        	setAdded(button[0]);
            }
            
            if (!articleStatus["isViewed"]) {
                let titleField = scholar.titleFieldSeclector(articleBlock[0]);
                let label = document.createElement('span');
                
	        	label.className = "label label-info";
				label.innerHTML = "New";
				label.style.marginLeft = "5px";
	        	titleField.appendChild(label);
            }
            button.click(articleId, function(event) {
	        	browser.runtime.sendMessage({
	        	    name: messages.SELECTED_ARTICLES,
	        	    data: [event.data]
	        	});
	        	setAdded(this);
	        });
            articleBlock.append(button);
        }
    }
    waitPageLoading = false;
}

let scholarStarter = $(() => {
    console.log("scholar begin");
	injectLocalCss();
	browser.runtime.sendMessage({name: messages.GET_TERMS});
	createTermsPanel();
	
    // For normalized article data arrived from server, initialize controls to attach
	// articles to research map
	browser.runtime.onMessage.addListener(function(message) {
        switch (message.name) {
            case messages.NORMALIZED_DATA: 
                handleNormalizedData(message);
                break;
			case messages.EXTRACTED_TERMS_RESEARCH:
                handleExtractedTermsResearch(message);
				break;
                case messages.EXTRACTED_TERMS_CLUSTERS:
				handleExtractedTermsClusters(message);
				break;
            }
        });
    if (scholar.name !== "semantic") {
        console.log(scholar.name);
        parseSearchResult();
    } else {
        console.log(scholar.name);
        let observer = new MutationObserver(function (mutations, me) {
            let canvas = document.getElementsByClassName('search-result');
            if (canvas != null && canvas.length) {
                let buttons = document.getElementsByClassName("add_to_rm_button");
                let buttonsPresent = buttons && buttons.length > 0
                if (!buttonsPresent && !waitPageLoading) {
                      waitPageLoading = true;
                      parseSearchResult();
                      
                    }
                    // stop observer
                    me.disconnect();
                    return;
            }
        });
        
        // start observing
        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }
    console.log("scholar end");
});