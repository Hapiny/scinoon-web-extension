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
        href: browser.runtime.getURL('lib/scholar_styles.css')
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
	termsPanel.id = "terms_panel"
	
	var titleBox = document.createElement('div');
	titleBox.textContent = "Terms from current research";
	titleBox.className = "btn btn-lg btn-dark";
	titleBox.id = "terms_panel_draggable"
	
	var centerBtn = document.createElement("center");
	var openTermsBtn = document.createElement('div');
	openTermsBtn.id = "open-btn";
	openTermsBtn.textContent = "Show Terms";
	openTermsBtn.className = "btn btn-primary";
	openTermsBtn.style.display = "table-cell";

	centerBtn.appendChild(openTermsBtn);
	titleBox.appendChild(centerBtn);
	termsPanel.appendChild(titleBox);
	
	var termsBox = document.createElement('div');
	termsBox.id = "termsBox";
	termsBox.style.display = "none";
	termsBox.className = "scholar_terms_box";
	
	var researchTermsBox = document.createElement('div');
	researchTermsBox.id = "researchTermsBox";
	
	
	termsBox.appendChild(researchTermsBox);
	termsPanel.appendChild(termsBox);
	
	document.body.appendChild(termsPanel);
	openTermsBtn.addEventListener("click", () => {
		var termsBoxDisplay = $("#termsBox")[0].style.display;
		if (termsBoxDisplay === "none") {
			$("#termsBox")[0].style.display = "block";
			$("#open-btn")[0].innerText = "Close Terms";
		} else {
			$("#termsBox")[0].style.display = "none";
			$("#open-btn")[0].innerText = "Show Terms";
		}
	});
	makeDraggableElement(termsPanel);
}

function addTermsTitle(text, termsBox) {
	var title = document.createElement('p');
	title.innerHTML = `<center><h3>${text}</h3></center>`;
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
	let termsBox = document.getElementById("termsBox");
	var clustersTermsBox = document.createElement('div');
	clustersTermsBox.id = "clustersTermsBox";
	termsBox.appendChild(clustersTermsBox);
	let clusterWithTermsList = message.data;
	for (let clusterWithTerms of clusterWithTermsList) {
		addTermsGroup(clusterWithTerms.clName, clusterWithTerms.terms, clustersTermsBox);
	}
}

function handleNormalizedData(message) {
    function setAdded(button) {
		button.textContent = "Added!"
		button.disabled = true;
    }
    
	let normalizedArticlesStatus = message.data;
    let articleBlocks = $(scholar.articleBlocksSelector);

    for (let index = 0; index < normalizedArticlesStatus.length; ++index) {
        let articleStatus = normalizedArticlesStatus[index];
        let articleId = articleStatus["article"]["id"];
        
        if (articleId.sourceName === scholar.articleSourceName) {
            let scholarId = articleId.privateId;
            let blockFilter = scholar.getBlockFilter(scholarId);

            let articleBlock = articleBlocks.has(blockFilter);
	        let button = $("<button>", {
	            id: `add_to_rm_${scholarId}`,
	            type: "button",
	            class: "btn btn-primary add_to_rm_button",
	            text: "Add to research map"
			});
			
            if (articleStatus["isExist"]) {
	        	setAdded(button[0]);
            }
            if (!articleStatus["isViewed"]) {
                let titleField = scholar.titleFieldSeclector(articleBlock[0]);
                let label = document.createElement('span');
                
	        	label.className = "btn btn-info btn-sm";
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
		}
	);

    if (scholar.name !== "semantic") {
        parseSearchResult();
    } else {
        let observer = new MutationObserver(function (mutations, me) {
			// console.log(mutations);
			let searchResult = document.getElementsByClassName("search-result");
            if (searchResult !== undefined && searchResult.length > 0) {
				let buttons = document.getElementsByClassName("add_to_rm_button");
                let buttonsPresent = buttons && buttons.length > 0
				console.log(buttons.length, searchResult.length);
                if (!buttonsPresent && !waitPageLoading) {
					waitPageLoading = true;
					parseSearchResult();
				}
				// stop observer
				// me.disconnect();
				// return;
			}
			
			let titleField = document.querySelector('[data-selenium-selector="paper-detail-title"]');
			if (titleField !== null && !waitPageLoading) {
				waitPageLoading = true;
				parseSearchResult();
				let addBtn = document.createElement("button");
				addBtn.className = "btn btn-primary";
				addBtn.textContent = "Add to research map";
				titleField.appendChild(addBtn);
				let title = titleField.innerText;
				console.log(title);
			}
        });
        // start observing
        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }
});