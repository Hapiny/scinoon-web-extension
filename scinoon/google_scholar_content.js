// ==UserScript==
// @name PageDataProvider
// @include http://scholar.google.*
// @include https://scholar.google.*
// @require types.js
// @require extractor.js
// @require lib/jquery-3.2.1.min.js
// ==/UserScript==

var $ = window.$.noConflict(true);
var searchString = document.evaluate("//div[@class='gs_in_txtw gs_in_txtb gs_in_acw']/input[@class='gs_in_txt gs_in_ac']", 
		document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value;
var baseTermLink = "http://" + window.location.hostname + "/scholar?q=";

// Inject custom scholar css
(function() {
	var scholarCssLink = $("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: browser.runtime.getURL('scholar_styles.css')
    });
    scholarCssLink.appendTo("head");
})();

// Parse article data and send it to background
(function () {
    console.log("obtaining url and dom...");
    var articles = extractor.extract(document);
    console.log(articles);
	browser.runtime.sendMessage({
	    name: messages.success.RETURN_EXTRACTED,
	    data: {
	    	url : window.location.href,
	    	articles : articles
	    }
	});
})();

function handleNormalizedData(message) {
	
	function setAdded(button) {
		button.textContent = "Added!"
		button.disabled = true;
	}
	
	console.log("normalized data arrived");
	
	var normalizedArticlesStatus = message.data;
	var articleBlocks = $("#gs_res_ccl_mid>.gs_r");
	console.log(articleBlocks.length);
	for (var index = 0; index < normalizedArticlesStatus.length; ++index) {
	    var articleStatus = normalizedArticlesStatus[index];
	    var articleId = articleStatus["article"]["id"];
	    if (articleId.sourceName == "scholar") {
	        var scholarId = articleId.privateId;
	        var blockFilter = "a[href*=\\?cites\\=" + scholarId + "]," +
	                          "a[href*=\\?cluster\\=" + scholarId + "]";
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
	        	var titleField = document.evaluate("./div[@class='gs_ri']/h3[@class='gs_rt']", 
		        		articleBlock[0], null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	        	var labelField = document.createElement('span');
	        	labelField.innerHTML = "\u00A0\u00A0";
	        	var label = document.createElement('span');
	        	label.className = "label label-info";
	        	label.innerHTML = "New";
	        	labelField.appendChild(label);
	        	titleField.appendChild(labelField);
	        }
	        button.click(articleId, function(event) {
	        	browser.runtime.sendMessage({
	        	    name: messages.success.SELECTED_ARTICLES,
	        	    data: [event.data]
	        	});
	        	setAdded(this);
	        });
	        articleBlock.append(button);
	    }
	}
}

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

function addTermToList(term, termsList) {
	var li = document.createElement('li');
	li.innerHTML = "<span><a href='" + baseTermLink + searchString + "+" + term + "'>" +
					 "<img src=" + browser.extension.getURL("/icons/add.png") + " alt='+' style='vertical-align: -25%'/>" +
				   "</a>" +
				   "&nbsp;<span class='term_text'>" +
				     "<a href='http://" + window.location.hostname + "/scholar?q=" + term + "'>" + term + "</a>" +
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

// For normalized article data arrived from server, initialize controls to attach
// articles to research map
browser.runtime.onMessage.addListener(function(message) {
	switch (message.name) {
		case messages.success.NORMALIZED_DATA: 
			handleNormalizedData(message);
			break;
		case messages.success.EXTRACTED_TERMS_RESEARCH:
			handleExtractedTermsResearch(message);
			break;
		case messages.success.EXTRACTED_TERMS_CLUSTERS:
			handleExtractedTermsClusters(message);
			break;
	}
});

browser.runtime.sendMessage({name: messages.success.GET_TERMS});
createTermsPanel();