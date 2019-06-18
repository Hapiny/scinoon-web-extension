const CONTENT_DEBUG = true;

let $ = window.$.noConflict(true);
let hostname = window.location.hostname;

if (hostname.search("google") !== -1) {
	var scholar = scholars.google;
	var extractor = new GSExtractor("google");
} else if (hostname.search("semantic") !== -1) {
	var scholar = scholars.semantic;
	var extractor = new SSExtractor("semantic");
}

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

function parseSearchResult(extractedData = undefined) {
	if (!extractedData) {
		var articles = extractor.extract(document);
	} else {
		var articles = extractedData;
	}
	if (CONTENT_DEBUG) {
		console.log("CONTENT: extractor result")
		console.log(articles[0]);
	}
	browser.runtime.sendMessage({
	    name: messages.RETURN_EXTRACTED,
	    data: {
	    	url : window.location.href,
	    	articles : articles
	    }
	});
};

function createTermsPanel() {
	if (document.getElementById("terms_panel") !== null) {
		return;
	}
	var termsPanel = document.createElement('div');
	termsPanel.className = "scholar_terms_panel bootstrap";
	termsPanel.id = "terms_panel"
	
	var titleBox = document.createElement('div');
	titleBox.textContent = "Terms from current research map";
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

function createAddButtons() {
	let articleBlocks = $(scholar.articleBlocksSelector);
	for (let index = 0; index < articleBlocks.length; index++) {
		let bootstrapTag = document.createElement("div");
		bootstrapTag.className = "bootstrap";
		let button = document.createElement("button");
		// button.id = `add_to_rm_${index}`;
		button.type = "button";
		button.className = "btn btn-primary btn-sm add_to_rm_button";
		button.textContent = "Loading...";
		bootstrapTag.appendChild(button);

		if (articleBlocks[index].getElementsByClassName("add_to_rm_button").length === 0) {
			articleBlocks[index].append(bootstrapTag);
		}
	}
}

function addButtonOnArticlePage() {
	let btnField = document.getElementsByClassName("flex-container flex-wrap flex-paper-actions-group");
	if (btnField.length) {
		btnField = btnField[0];
		let bootstrapTag = document.createElement("div");
		bootstrapTag.className = "bootstrap";
		let button = document.createElement("button");
		button.id = `add_to_rm_${0}`;
		button.type = "button";
		button.style.marginTop = "10px";
		button.style.marginLeft = "10px";
		button.className = "btn btn-primary btn-sm add_to_rm_button";
		button.textContent = "Loading...";
		bootstrapTag.appendChild(button);

		if (document.getElementById(`add_to_rm_${0}`) === null) {
			btnField.append(bootstrapTag);
		}
		if (CONTENT_DEBUG) {
			console.log("CONTENT: adding btn");
		}
	}
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
		button.innerText = "Added!"
		button.disabled = true;
    }
    
	let normalizedArticlesStatus = message.data;
	if (CONTENT_DEBUG) {
			console.log("CONTENT: handle normalized data");
			console.log(normalizedArticlesStatus);
	}
	let articleBlocks = $(scholar.articleBlocksSelector);

    for (let index = 0; index < normalizedArticlesStatus.length; ++index) {
        let articleStatus = normalizedArticlesStatus[index];
        let articleId = articleStatus["article"]["id"];
        if (articleId.sourceName === scholar.articleSourceName) {
            let scholarId = articleId.privateId;
            let blockFilter = scholar.getBlockFilter(scholarId);

			let articleBlock = articleBlocks.has(blockFilter);
			let button = $(".btn.add_to_rm_button")[index];
			if (button) {
				button.innerText = "Add to research map";			
				if (articleStatus["isExist"]) {
					setAdded(button);
				}
				button.addEventListener("click", function(event) {
					browser.runtime.sendMessage({
						name: messages.SELECTED_ARTICLES,
						data: [articleId]
	        		});
	        		setAdded(this);
				});
			} else {
				console.log("CONTENT: error in button change");
				console.log(`#add_to_rm_${index}`);
				console.log($(".btn.add_to_rm_button"));
			}
			// Add "NEW" bage in Title Field of article
            if (!articleStatus["isViewed"]) {
				console.log(articleBlock);
				let titleField = scholar.titleFieldSeclector(articleBlock[0]);
				let bootstrapTag = document.createElement("div");
				bootstrapTag.className = "bootstrap";
                let label = document.createElement("span");
	        	label.className = "btn btn-info btn-sm";
				label.innerHTML = "New";
				label.style.marginLeft = "5px";
				
				bootstrapTag.appendChild(label)
	        	titleField.appendChild(bootstrapTag);
			}
        }
    }
}


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
browser.runtime.sendMessage({name: messages.GET_TERMS});
injectLocalCss();
createTermsPanel();
switch(scholar.name) {
	case "google":
		createAddButtons();
		parseSearchResult();
		break;
	case "semantic":
		window.onload = () => {
			let urlParts = window.location.href.split("/");
			if (urlParts.indexOf("paper") !== -1) {
				addButtonOnArticlePage();
				let article = parseArticleOnPage();
				if (CONTENT_DEBUG) {
					console.log(article);
				}
				parseSearchResult(article);
			}
		}
	
		let observerProps = {
			childList: true,
			subtree: true,
			attributeFilter: ['style']
		}
	
		let observer = new MutationObserver((mutations, obs) => {
			mutations.forEach((mutation) => {
				if (mutation.target.tagName === "TITLE") {
					let url = window.location.href;
					let newTitleName = mutation.target.innerText;
					if (CONTENT_DEBUG) {
						console.log(`CONTENT: new title "${newTitleName}"`);
					}
					if (url.search("/search") !== -1) {
						createAddButtons();
						parseSearchResult();
					} else if (url.search("/paper/") !== -1) {
						addButtonOnArticlePage();
						let article = parseArticleOnPage();
						if (CONTENT_DEBUG) {
							console.log(article);
						}
						parseSearchResult(article);
					} else if (url.search("/author/") !== -1) {
						createAddButtons();
						parseSearchResult();
					}
				}
			});
		});
		observer.observe(document, observerProps);
		break;
	case "arxiv":
		createTermsPanel();
		parseSearchResult();
}
