// ==UserScript==
// @name PageDataProvider
// @include http://scholar.google.*
// @include https://scholar.google.*
// @require types.js
// @require extractor.js
// @require lib/jquery-3.2.1.min.js
// ==/UserScript==

var $ = window.$.noConflict(true);
var searchString = document.getElementsByClassName("input form-input")[0].value;
var baseTermLink = "http://" + window.location.hostname + "/search?q=";
var addLock = false;

// Inject custom scholar css
function InjectCSS() {
	var scholarCssLink = $("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: browser.runtime.getURL('scholar_styles.css')
    });
    scholarCssLink.appendTo("head");
};

// Parse article data and send it to background
function ParseArticles(){
	console.log(baseTermLink);
    console.log("obtaining url and dom...");
    var articles = extractor.extract(document);
    console.log("beforeSendParsed");
    console.log(articles);
	browser.runtime.sendMessage({
	    name: messages.RETURN_EXTRACTED,
	    data: {
	    	url : window.location.href,
	    	articles : articles
	    }
	});
}

function handleNormalizedData(message) {
	
	function setAdded(button) {
		button.textContent = "Added!"
		button.disabled = true;
	}
	
	console.log("normalized data arrived");
	
	var normalizedArticlesStatus = message.data;
	var articleBlocks = $('.search-result');
	for (var index = 0; index < normalizedArticlesStatus.length; ++index) {
	    var articleStatus = normalizedArticlesStatus[index];
	    var articleId = articleStatus["article"]["id"];
	    if (articleId.sourceName == "ext-semantic-scholar") {
	        var scholarId = articleId.privateId;
			var blockFilter = "a[data-heap-paper-id=" + scholarId + "]";
	        var articleBlock = articleBlocks.has(blockFilter);
	        var button = $("<button>", {
	            id: "add_to_rm_" + scholarId,
	            type: "button",
	            class: "add_to_rm_button",
	            text: "Add to research map"
	        });
	        
	        if (articleStatus["isExist"]) {
	        	setAdded(button[0]);
	        }

	        if (!articleStatus["isViewed"]) {
	        	// var titleField = document.evaluate(".//div[@class='search-result-title']/a[@data-selenium-selector='title-link']", 
                // 		articleBlock[0], null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                var titleField = articleBlock[0].getElementsByTagName("a")[0];
	        	var label = document.createElement('span');
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
	console.log("addLockUnlocked");
	addLock = false;
}

function createTermsPanel() {
	var termsPanel = document.createElement('div');
	termsPanel.className = "scholar_terms_panel";
	var titleBox = document.createElement('div');
	var panelTitle = document.createElement('p');
	panelTitle.innerHTML = "<center><h2>Terms from current research</h2></center>";
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

function addTermToList(term, termsList) {
	var li = document.createElement('li');
	li.innerHTML = "<span><a href='" + baseTermLink + searchString + "+" + term + "'>" +
					 "<img src=" + browser.extension.getURL("/icons/add.png") + " alt='+' style='vertical-align: -25%'/>" +
				   "</a>" +
				   "&nbsp;<span class='term_text'>" +
				     "<a href='http://" + window.location.hostname + "/search?q=" + term + "'>" + term + "</a>" +
				   "</span></span>";
	li.className = "term_list_item";
	termsList.appendChild(li);
}

function addTermsTitle(text, termsBox) {
	var title = document.createElement('p');
	title.innerHTML = "<center><h4>" + text + "</h4></center>";
	termsBox.appendChild(title);
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
	var termsBox = document.getElementById('researchTermsBox');
	addTermsGroup('Common terms', message.data, termsBox);
}

function handleExtractedTermsClusters(message) {
	var termsBox = document.getElementById('clustersTermsBox');
	var clusterWithTermsList = message.data;
	for (let clusterWithTerms of clusterWithTermsList) {
		addTermsGroup(clusterWithTerms.clName, clusterWithTerms.terms, termsBox);
	}
}


let scholarStarter = $(() => {
	InjectCSS();
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


	// `mutations` is an array of mutations that occurred
	// `me` is the MutationObserver instance
	var observer = new MutationObserver(function (mutations, me) {
	  var canvas = document.getElementsByClassName('search-result');
	  if (canvas != null && canvas.length) {
			var buttonsPresent = document.getElementsByClassName("add_to_rm_button") && document.getElementsByClassName("add_to_rm_button").length > 0
			if (!buttonsPresent && !addLock){
				addLock = true;
				console.log("addLockLocked");
				ParseArticles();
				
			}
	    //me.disconnect(); // stop observing
	    return;
	  }
	});

	// start observing
	observer.observe(document, {
	  childList: true,
	  subtree: true
	});
});


