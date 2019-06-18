class GSExtractor extends Extractor {
    constructor(name="google") {
        super(name);
    }

    parseOrigin(origin) {
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

    extract(doc) {
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
					var elem = doc.evaluate(attr2path[attr], thisNode, null,
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
				var originData = this.parseOrigin(originString);
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
    }
}