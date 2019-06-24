class PubmedExtractor extends Extractor {
    constructor(name, blockSelector, verbose) {
        super(name, blockSelector, verbose);
    }

    extract(doc) {
        let extractedArticles = [];
        let hostname = window.location.hostname;
        for (let block of this.blocks) {
            let article = {
                ids : [{
                    id  : block.querySelector("dd").innerText,
                    src : "pubmed",
                }],
            };
            article.title               = this.getTitle(block, "p.title");
            article.authors             = this.getAuthors(block, "p.desc");
            article.textUrl             = hostname + "/pubmed/" + article.ids[0].id;
            article.year                = this.getYear(block, "p.details");
            article.similarArticlesRefs = this.getSimilarArticlesRefs(block, "p.links.nohighlight > a");
            article.doi                 = this.getDoi(block, "p.details");
            extractedArticles.push(article);
        };


        return extractedArticles;
    }

    getAuthors(block, authorsSelector) {
        let authorsField = block.querySelector(authorsSelector);
        let authors = [];
        if (!authorsField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): authors aren't extracted`);
        } else if (this.verbose) {
            console.log(`EXTRACTOR (${this.name}): authors extracted`);
            let authorsElems = authorsField.innerText.slice(0,-1).split(", ");
            for (let author of authorsElems) {
                authors.push({
                    fullName : author,
                    ids      : {},
                });
            }
            console.log(authors);
        }
        return authors;
    }

    getYear(block, yearSelector) {
        let yearField = block.querySelector(yearSelector);
        let year = 2000;
        if (!yearField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): year isn't extracted`);
        } else if (this.verbose) {
            let match_ = yearField.innerText.match(/\. (\d{4})/);
            if (match_) {
                year = parseInt(match_[1]);
            }
            console.log(`EXTRACTOR (${this.name}): extracted year = ${year}`);
        }
        return year;
    }
    
    getSimilarArticlesRefs(block, selector) {
        let similarField = block.querySelector(selector);
        let similarRefs = [];
        if (!similarField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): similar refs aren't extracted`);
        } else if (this.verbose) {
            console.log(`EXTRACTOR (${this.name}): similar refs extracted`);
            similarRefs.push({
                link : similarField.getAttribute("href"),
                amount : 0,
                ids    : [],
            }); similarField
        }
        return similarRefs;
    }
    
    getDoi(block, doiSelector) {
        let doiField = block.querySelector(doiSelector);
        let doi = "";
        if (!doiField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): doi isn't extracted`);
        } else if (this.verbose) {
            let match_ = doiField.innerText.match(/doi: (\d.*)\. /);
            if (match_) {
                doi = match_[1];
            }
            console.log(`EXTRACTOR (${this.name}): extracted doi = ${doi}`);
        }
        return doi;
    }

    getTextLink(selector=".icons.portlet > a") {
        let linkField = document.querySelector(selector);
        let link = "";
        if (linkField) {
            link = linkField.getAttribute("href");
        }
        return link;
    }

    extractArticleFromPage(blockSelector="div.rprt.abstract") {
        let url = window.location.href;
        let article = {
            ids : [{
                id : url.split("/").slice(-1)[0],
                src : "pubmed",
            }]
        };

        let articleBlock    = document.querySelector(blockSelector);
        article.title       = this.getTitle(articleBlock, "h1");
        article.year        = this.getYear(articleBlock, "div.cit");
        article.textUrl     = this.getTextLink(".icons.portlet > a");
        article.absractText = this.getAbstract(articleBlock, "div.abstr").replace("Abstract", "").trim();
        article.doi         = this.getDoi(articleBlock, "div.cit");     

        let authors = this.getAuthors(articleBlock, "div.auths");
        article.authors= [];
        for (let author of authors) {
            article.authors.push({
                fullName : author.fullName.slice(0, -1),
                ids      : [],
            });
        }
        return [article];
    }
}