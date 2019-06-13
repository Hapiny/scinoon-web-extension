/*
 * This file includes all logic needed for data extraction from document
 */

var extractor = {
	GSExtractor : function(doc) {
		function parseOrigin(origin) {
			var result = {}
			var authors_publisher_year = origin.split("- ");
			result["authors"] = authors_publisher_year[0].replace(/…/g, "").trim().split(", ")
			    .filter(function(a) { return !!a; })
			if (authors_publisher_year.length > 2) {
				var yearMatches = authors_publisher_year[1].match(/\d{4}/g);
				if (yearMatches && yearMatches.length > 0) {
					result["year"] = parseInt(yearMatches.pop());
				}
			}
			return result;
		}

		// Hardcode GS-specific XPaths
		var commonPath = "//div[@id='gs_res_ccl_mid']/div[@class='gs_r gs_or gs_scl']/div[@class='gs_ri']";
		var attr2path = {
			"title" : "./h3[@class='gs_rt']",
			"abstractText" : "./div[@class='gs_rs']",
			"citesCount" : "./div[@class='gs_fl']/a[3]",
			"citesQuery" : "./div[@class='gs_fl']/a[3]/@href"
		};

		var originPath = "./div[@class='gs_a']";
		var versionsPath = "./div[@class='gs_fl']/a[@class='gs_nph']/@href"

		var textLinkPath = "../div[@class='gs_ggs gs_fl']//a/@href",
		    textTypePath = "../div[@class='gs_ggs gs_fl']//span[@class='gs_ctg2']";

		var titlePrefixPath = "./h3[@class='gs_rt']/span[1]";
		var citedArticleGlobalPath = "//*[@id='gs_res_ccl_top']/div/h2/a/@href";

		// For GS pages of citing articles extract cited article clusterId
		var citedArticleHref = doc.evaluate(
			citedArticleGlobalPath, 
			doc, 
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE, 
			null).singleNodeValue;

		var citedArticleClusterId = null;
		if (citedArticleHref != null) {
			citedArticleClusterId = /cluster=(\d*)/.exec(citedArticleHref.value)[1];
		}

		var itemIterator = doc.evaluate(commonPath, doc, null,
				XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		var result = [];
		try {
			var thisNode = itemIterator.iterateNext();
			while (thisNode) {
				var article = {};
				for ( var attr in attr2path) {
					elem = doc.evaluate(attr2path[attr], thisNode, null,
							XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					if (elem) {
						article[attr] = elem.textContent;
					}
				}

				// Save clusterId for articles which have it
				if (typeof article["citesQuery"] != "undefined") {
					var clusterIdMatch = /cites=(\d*)/.exec(article["citesQuery"]);
					if (clusterIdMatch != null && clusterIdMatch.length > 1) {
						article["clusterId"] = clusterIdMatch[1];
					}
				}

				if (typeof article["clusterId"] === "undefined") {
					// Try to extract from All * versions link
					var versionsUrl = doc.evaluate(versionsPath, thisNode, null,
							XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					if (versionsUrl) {
						var clusterIdMatch = /cluster=(\d*)/.exec(versionsUrl.textContent);
						if (clusterIdMatch != null && clusterIdMatch.length > 1) {
							article["clusterId"] = clusterIdMatch[1];
						}
					}
				}

				if (typeof article["clusterId"] === "undefined") {
					// Cannot process articles without clusterId
					thisNode = itemIterator.iterateNext();
					continue
				}

				// Postprocessing for citesCount
				var citesCountMatch = article["citesCount"]
						.match(/.*?(\d+)$/);
				if (typeof citesCountMatch === "undefined"
						|| citesCountMatch == null) {
					article["citesCount"] = 0;
				} else {
					article["citesCount"] = parseInt(citesCountMatch[1]);
				}

				// Parse authors string
				var originString = doc.evaluate(originPath, thisNode, null,
						XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;
				var originData = parseOrigin(originString);
				for ( var a in originData) {
					article[a] = originData[a];
				}

				// Add references
				if (citedArticleClusterId != null) {
					article["reference"] = citedArticleClusterId;
				}

				// Postprocessing for title
				var titlePrefixElem = doc.evaluate(titlePrefixPath, thisNode, null,
						XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if (titlePrefixElem) {
					var prefix = titlePrefixElem.textContent;
					article["title"] = article["title"].replace(prefix, "").trim();
				}

				// Add link to text (in pdf/html/etc.)
				var textLinkElem = doc.evaluate(textLinkPath, thisNode, null,
						XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				var textTypeElem = doc.evaluate(textTypePath, thisNode, null,
						XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if (textLinkElem && textTypeElem) {
					article["textLink"] = textLinkElem.textContent;
					article["textType"] = textTypeElem.textContent.slice(1, -1);
				}

				result.push(article);
				thisNode = itemIterator.iterateNext();
			}
		} catch (e) {
			console.log(e);
		}
		return result;
	},
	
	SSExtractor : function(doc) {
		
		var clickEvent = new MouseEvent("click", {
			"view": window,
			"bubbles": true,
			"cancelable": false
		});
		
		var result = [];
		var blocks = doc.getElementsByClassName("search-result");
			
		for(var i = 0; i <= blocks.length-1; i+=1) {
			
			if (blocks[i].getElementsByClassName("more mod-clickable")[0] != undefined) { 
				blocks[i].getElementsByClassName("more mod-clickable")[0].dispatchEvent(clickEvent);
			}
			
			var article = {};
			
			article["ids"] = [];
			
			article["authors"] = [];
			var authors_elements = blocks[i].getElementsByClassName("author-list__link");
			for(var j = 0; j <= authors_elements.length-1; j+=1) {
				var author = {};
				author["fullName"] = authors_elements[j].innerText;
				author["ids"] = [];
				article["authors"].push(author);
			}
						
			var paperLink = blocks[i].getElementsByClassName("icon-button paper-link")[0];
			if(paperLink &&  paperLink.innerText.search("View Paper") != -1) {
				article["textType"] = "pdf";
				article["textUrl"] = paperLink.getAttribute("href");
			}
			
			var title_element = blocks[i].getElementsByClassName("search-result-title")[0];
			var id = {};
			id["src"] = "semantic-scholar";
			id["id"] = title_element.getElementsByTagName("a")[0].getAttribute("href").split('/').pop();
			article["ids"].push(id);
			article["title"] = title_element.innerText;
			
			article["year"] = parseInt(blocks[i].querySelectorAll('[data-selenium-selector="paper-year"]')[0].innerText);
			
			if (blocks[i].getElementsByClassName("abstract full-abstract")[0] != undefined) {
				article["abstractText"] = blocks[i].getElementsByClassName("abstract full-abstract")[0].innerText;
			}
			
			if (blocks[i].getElementsByClassName("more mod-clickable")[0] != undefined) { 
				blocks[i].getElementsByClassName("more mod-clickable")[0].dispatchEvent(clickEvent);
			}
			result.push(article);
		}
		
		return result;
	},

	extract : function(doc) {
		// TODO: switch depending on URL
		if (doc.location['href'].search("scholar.google") !== -1 ) {
			return this.GSExtractor(doc);
		}
		else if (doc.location['href'].search("semanticscholar") !== -1 ) {
			return this.SSExtractor(doc);
		}
	}
};
