/*
 * This file includes all logic needed for data extraction from document
 */

var extractor = {
	GSExtractor : (doc) => {
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
		console.log(result[0]);
		return result;
	},
	
	SSExtractor : (doc) => {
		let extractedArticles = [];
		let articleBlocks = doc.getElementsByClassName("search-result");

		for(let block of articleBlocks) {
			let article = {
				ids : [], authors : []
			};
			let moreAuthorsButton = block.getElementsByClassName("more-authors-label")[0];
			// click to get full list of authors
			if (moreAuthorsButton) {
				moreAuthorsButton.click();
			}
			
			let authorsElements = block.getElementsByClassName("author-list__link");
			for(let elem of authorsElements) {
				let author = {
					fullName : elem.innerText, 
					ids : []
				};
				article.authors.push(author);
			}
			
			moreAuthorsButton = block.getElementsByClassName("more-authors-label")[0];
			// hide list of authors
			if (moreAuthorsButton) {
				moreAuthorsButton.click();
			}
			
			////////////////////////////////////////////////////////////////////////////////////
			let paperLink = block.getElementsByClassName("icon-button paper-link")[0];
			if(paperLink &&  paperLink.innerText.search("View Paper") != -1) {
				article["textType"] = "pdf";
				article["textUrl"] = paperLink.getAttribute("href");
			}
			////////////////////////////////////////////////////////////////////////////////////
			
			let titleElement = block.getElementsByClassName("search-result-title")[0];
			let info = {
				id  : titleElement.getElementsByTagName("a")[0].getAttribute("href").split('/').pop(),
				src : "semantic-scholar",
			};
			article.ids.push(info);
			article.title = titleElement.innerText;
			
			let yearField = block.querySelector('[data-selenium-selector="paper-year"]');
			if (yearField) {
				article["year"] = parseInt(yearField.innerText);
			}

			let moreAbstractButton = block.getElementsByClassName("more mod-clickable")[0];
			// click to get full abstract
			if (moreAbstractButton) {
				moreAbstractButton.click();
			}
			
			let abstractField = block.getElementsByClassName("abstract")[0];
			if (abstractField) {
				article["abstractText"] = abstractField.innerText.slice(0, -7);
			}
			// click to hide full abstract
			if (moreAbstractButton) {
				moreAbstractButton.click();
			}

			extractedArticles.push(article);
		}
		
		return extractedArticles;
	},
	
	extract : function(doc) {
		if (doc.location['href'].search("scholar.google") !== -1) {
			return this.GSExtractor(doc);
		}
		else if (doc.location['href'].search("semanticscholar") !== -1) {
			return this.SSExtractor(doc);
		}
	}
};
