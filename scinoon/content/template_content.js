const CONTENT_DEBUG = true;

let $ = window.$.noConflict(true);
let hostname = window.location.hostname;
let extractor = undefined;
let observerProps = {
	childList: true,
	subtree: true,
	attributeFilter: ['style']
}

let scholar = undefined;
if (hostname.search("google") !== -1) {
	scholar = scholars.google;
} else if (hostname.search("semantic") !== -1) {
	scholar = scholars.semantic;
} else if (hostname.search("arxiv") !== -1) {
	scholar = scholars.arxiv;
} else if (hostname.search("ncbi.nlm.nih.gov") !== -1) {
	scholar = scholars.pubmed;
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

function parseSearchResult(extractor, extractedData = undefined) {
	if (!extractedData) {
		var articles = extractor.extract(document);
	} else {
		var articles = extractedData;
	}
	if (CONTENT_DEBUG) {
		console.log("CONTENT: extractor result")
		console.log(articles);
	}
	browser.storage.local.get("anotherMaps").then(data => {
		let	maps = data.anotherMaps;
		for (let i = 0; i < maps.length; i++) {
			let mapName = maps[i].split("/").slice(-1)[0];
			console.log(mapName);
			browser.runtime.sendMessage({
				name: messages.RETURN_EXTRACTED,
				data: {
					url      : window.location.href,
					articles : articles,
					map      : mapName,
				}
			});
		}
	});
};

function handleExtractedTermsResearch(message) {
	let termsBox = document.getElementById('researchTermsBox');
	addTermsGroup('Common terms', message.data, termsBox, searchString);
}

function handleExtractedTermsClusters(message) {
	let termsBox = document.getElementById("termsBox");
	var clustersTermsBox = document.createElement('div');
	clustersTermsBox.id = "clustersTermsBox";
	termsBox.appendChild(clustersTermsBox);
	let clusterWithTermsList = message.data;
	for (let clusterWithTerms of clusterWithTermsList) {
		addTermsGroup(clusterWithTerms.clName, clusterWithTerms.terms, clustersTermsBox, searchString);
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

	let articleBlocks = extractor.blocks;
    for (let index = 0; index < normalizedArticlesStatus.length; index++) {
        let articleStatus = normalizedArticlesStatus[index];
        let articleId = articleStatus.article.id;
        if (articleId.sourceName === scholar.articleSourceName) {
			let articleBlock = articleBlocks[index];
			let button = articleBlock.querySelector(".btn.add_to_rm_button");
			if (button) {
				button.innerText = "Add to research map";			
				if (articleStatus.isExist) {
					setAdded(button);
				}
				button.addEventListener("click", function(event) {
					browser.runtime.sendMessage({
						name: messages.SELECTED_ARTICLES,
						data: [articleId],
						map : button.map,
	        		});
	        		setAdded(this);
				});
			} else {
				console.log("CONTENT: error in button change");
				console.log(`#add_to_rm_${index}`);
				console.log($(".btn.add_to_rm_button"));
			}
			// Add "NEW" bage in Title Field of article
            if (!articleStatus.isViewed) {
				let titleField = scholar.titleFieldSeclector(articleBlock);
				if (titleField) {
					let bootstrapTag = document.createElement("div");
					bootstrapTag.className = "bootstrap";
					let label = document.createElement("span");
					label.className = "btn btn-info btn-sm";
					label.innerHTML = "New";
					label.style.marginRight = "5px";
					bootstrapTag.appendChild(label)
					titleField.insertBefore(bootstrapTag, titleField.firstChild);
				}
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
		extractor = new GSExtractor("google", scholar.articleBlocksSelector, CONTENT_DEBUG);
		var url = window.location.href;
		if (url.search("/citations?") !== -1) {
			let extracted = extractor.extractArticlesFromAuthorPage();
			createAddButtons(extractor.blocks);
			parseSearchResult(extractor, extracted);
			let observer = new MutationObserver((mutations, obs) => {
				mutations.forEach((mutation) => {
					if (mutation.target.tagName == "TBODY") {
						let extracted = extractor.extractArticlesFromAuthorPage();
						removeAllNodes("#gsc_a_b", ".bootstrap");
						createAddButtons(extractor.blocks);
						parseSearchResult(extractor, extracted);
					}
				});
			});
			observer.observe(document, observerProps);
		} else {
			createAddButtons();
			parseSearchResult(extractor);
		}
		break;
	case "semantic":
		extractor = new SSExtractor("semantic", scholar.articleBlocksSelector, CONTENT_DEBUG);
		
		window.onload = () => {
			let url = window.location.href;
			if (url.search("/paper/") !== -1) {
				addButtonOnArticlePage(".flex-container.flex-wrap.flex-paper-actions-group");
				let article = extractor.extractArticleFromPage();
				parseSearchResult(extractor, article);
			} else if (url.search("/author/") !== -1) {
				createAddButtons();
				parseSearchResult(extractor);
			}
		}
		let observer = new MutationObserver((mutations, obs) => {
			mutations.forEach((mutation) => {
				//  || document.readyState === "complete"
				if (mutation.target.tagName === "TITLE") {
					let url = window.location.href;
					let newTitleName = mutation.target.innerText;
					if (CONTENT_DEBUG) {
						console.log(`CONTENT: new title "${newTitleName}"`);
					}
					if (url.search("/search") !== -1 || url.search("/author/") !== -1) {
						createAddButtons();
						parseSearchResult(extractor);
					} else if (url.search("/paper/") !== -1) {
						addButtonOnArticlePage(".flex-container.flex-wrap.flex-paper-actions-group");
						let article = extractor.extractArticleFromPage();
						parseSearchResult(extractor, article);
					}
				}
			});
		});
		observer.observe(document, observerProps);
		break;
	case "arxiv":
		extractor = new ArxivExtractor("arxiv", scholar.articleBlocksSelector, CONTENT_DEBUG);
		var url = window.location.href;
		if (url.search("/search/") !== -1) {
			createAddButtons();
			parseSearchResult(extractor);
		} else if (url.search("/abs/") !== -1) {
			addButtonOnArticlePage("div#content");
			let article = extractor.extractArticleFromPage();
			parseSearchResult(extractor, article);
		}
		break;
	case "pubmed":
		extractor = new PubmedExtractor("pubmed", scholar.articleBlocksSelector, CONTENT_DEBUG);
		var url = window.location.href;
		if (url.search("/?term=") !== -1) {
			createAddButtons();
			parseSearchResult(extractor);
		} else {
			addButtonOnArticlePage("div.aux");
			let article = extractor.extractArticleFromPage();
			parseSearchResult(extractor, article);
		}
		break;
}
