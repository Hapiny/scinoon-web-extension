class GSExtractor extends Extractor {
    constructor(name, blockSelector, verbose=false) {
        super(name, blockSelector, verbose);
    }

    extract(doc) {
		let extractedArticles = [];
        for (let block of this.blocks) {
            let article = {};
            let clusterIdField = block.querySelector("h3[class='gs_rt'] > a");
            if (clusterIdField) {
                article.clusterId = clusterIdField.getAttribute("data-clk").match(/$\d+$/);
            }
            article.title = this.getTitle(block, "h3[class='gs_rt']");
            article.abstractText = this.getAbstract(block, "div[class='gs_rs']");
            article.authors = this.getAuthors(block, "div[class='gs_a']");
            article.year = this.getYear(block, "div[class='gs_a']");
            article.citesCount = this.getCitesCount(block, "div[class='gs_fl'] > a:nth-child(3)");
            article.citesQuery = this.getCitesQuery(block, "div[class='gs_fl'] > a:nth-child(3)");
            article.textLink = this.getTextLink(block, "div.gs_ggs.gs_fl > div > div > a");
            article.textType = this.getTextType(block, "div.gs_ggs.gs_fl > div > div > a > span.gs_ctg2");

            if (article.citesQuery && !article.clusterId) {
                let clusterIdMatch = /cites=(\d*)/.exec(article.citesQuery);
                if (clusterIdMatch !== null && clusterIdMatch.length > 1) {
                    article.clusterId = clusterIdMatch[1];
                }
            }
            if (!article.clusterId) {
                continue;
            } else {
                extractedArticles.push(article);
            }
        }
		return extractedArticles;
    }

    getAbstract(block, abstractSelector) {
        let abstractText = super.getAbstract(block, abstractSelector);
        return abstractText.replace("…", "").trim();
    }

    getTitle(block, titleSelector) {
        let title = super.getTitle(block, titleSelector);
        let titlePrefix = block.querySelector("h3[class='gs_rt'] > span");
        if (titlePrefix) {
            titlePrefix = titlePrefix.innerText;
            title = title.replace(titlePrefix, "").trim();
        }
        return title;
    }

    getTextType(block, textTypeSelector) {
        let textTypeField = super.getTextType(block, textTypeSelector);
        let textType = "";
        if (textTypeField) {
            textType = textTypeField.innerText.slice(1, -1);
        }
        return textType;
    }

    getAuthors(block, authorsSelector) {
        let authorsField = super.getAuthors(block, authorsSelector);
        let authors = [];
        if (authorsField.length) {
            let authorsString = authorsField[0].innerText.split("- ")[0];
            authors = authorsString.replace("…", "").trim().split(", ").filter((a) => { return !!a; });
        }
        if (this.verbose) {
            console.log(authors);
        }
        return authors;
    }

    getYear(block, yearSelector) {
        let yearField = super.getAuthors(block, yearSelector);
        let year = 2000;
        if (yearField.length) {
            let yearString = yearField[0].innerText.split("- ")[1];
            year = parseInt(yearString.match(/\d{4}/g)[0]);
        }
        if (this.verbose) {
            console.log(year);
        }        
        return year;
    }

    getCitesCount(block, citesCountSelector) {
        let citesCountField = block.querySelector(citesCountSelector);
        let citesCount = 0;
        if (citesCountField) {
            citesCount = parseInt(citesCountField.innerText.match(/\d+/g)[0]);
        }
        return citesCount;
    } 

    getCitesQuery(block, citesQuerySelector) {
        let citesQueryField = block.querySelector(citesQuerySelector);
        let citesQuery = "";
        if (citesQueryField) {
            citesQuery = citesQueryField.getAttribute("href");
        }
        return citesQuery;
    }
}