class ArxivExtractor extends Extractor {
    constructor(name, blockSelector, verbose=false) {
        super(name, blockSelector, verbose);
    }

    extract(doc) {
        let extractedArticles = [];
        for (let block of this.blocks) {
            let article = {
                ids : [],
            };
            let articleIdField = block.querySelector(".list-title.is-inline-block > a");
            if (!articleIdField) {
                continue;
            }
            article.ids.push({
                id  : articleIdField.href.split("/").slice(-1)[0],
                src : "arxiv",
            });

            article.title        = this.getTitle(block, "p.title.is-5.mathjax").trim();
            article.textUrl      = articleIdField.href;
            article.textType     = "PDF";
            article.authors      = this.getAuthors(block, ".authors");
            article.abstractText = this. getAbstract(block, ".abstract-full").trim().slice(0, -15);
            article.year         = this.getYear(block, "p.is-size-7");
            extractedArticles.push(article);
        }
        return extractedArticles;
    }

    getAuthors(block, authorsSelector) {
        let authorsField = block.querySelector(authorsSelector);
        let authors = [];
        if (!authorsField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): authors aren't extracted`);
        } else if (this.verbose) {
            console.log(`EXTRACTOR (${this.name}): authors extracted`);
            let authorsString = authorsField.innerText.replace("Authors:", "").trim();
            let authorsElems = authorsString.split(", ");
            for (let author of authorsElems) {
                authors.push({
                    fullName : author,
                    ids      : [],
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
            year = parseInt(yearField.innerText.match(/\d{4}/g)[0]);
            console.log(`EXTRACTOR (${this.name}): extracted year = ${year}`);
        }
        return year;
    }

    extractArticleFromPage(articleBlockSelector="div#content") {
        let url = window.location.href;
        let articleBlock = document.querySelector(articleBlockSelector);
        this.blocks = [articleBlock];
        let article = {
            ids : [{
                id  : url.split("/").slice(-1)[0],
                src : "arxiv", 
            }]
        };
        article.title        = this.getTitle(articleBlock, "h1.title.mathjax");
        article.authors      = this.getAuthors(articleBlock, "div.authors");
        article.year         = this.getYear(articleBlock, "div.dateline");
        article.abstractText = this.getAbstract(articleBlock, "blockquote.abstract.mathjax");
        article.textUrl      = url;
        article.textType     = "PDF";
        return [article];
    }
}