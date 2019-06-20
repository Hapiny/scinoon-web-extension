class SSExtractor extends Extractor {
    constructor(name, blockSelector, verbose=false) {
        super(name, blockSelector, verbose);
    }

    extract(doc) {
        let extractedArticles = [];
        // in function extract guaranteed that the page is loaded
        this.getBlocks();
		// if (!this.blocks.length) {
        //     console.log("refilling blocks");
        //     this.getBlocks();
        // }

		for (let block of this.blocks) {
			let article = {
				ids : [],
			};
            let titleElement = block.querySelector(".search-result-title");
			let info = {
                id  : titleElement.getElementsByTagName("a")[0].getAttribute("href").split('/').pop(),
				src : "semantic-scholar",
			};
			article.ids.push(info);
			
			article.authors = this.getAuthors(block, ".author-list__link");
            article.textUrl = this.getTextLink(block, ".icon-button.paper-link");
            article.textType = this.getTextType(block, ".icon-button.paper-link");
            article.title = this.getTitle(block, ".search-result-title");
			article.year = this.getYear(block, '[data-selenium-selector="paper-year"]');
			article.abstractText = this.getAbstract(block, ".abstract");

            extractedArticles.push(article);
        }
		return extractedArticles;
    }

    getAuthors(block, authorsSelector) {
        let authors = []
        let moreAuthorsButton = block.querySelector(".more-authors-label");
        // click to get full list of authors
        if (moreAuthorsButton) {
            moreAuthorsButton.click();
        }

        let authorsElements = super.getAuthors(block, authorsSelector);
        for(let elem of authorsElements) {
            let authorUrl = elem.getAttribute("href");
            let author = {
                fullName : elem.innerText, 
                ids : [{
                    id  : authorUrl.split("/").pop(),
                    src : window.location.hostname + authorUrl
                }]
            };
            authors.push(author);
        }

        moreAuthorsButton = block.querySelector(".more-authors-label");
        // hide list of authors
        if (moreAuthorsButton) {
            moreAuthorsButton.click();
        }

        if (this.verbose) {
            console.log(`EXTRACTOR (${this.name}):`);
            console.log(authors);
        }

        return authors;
    }

    getAbstract(block, abstractSelector) {
        let moreAbstractButton = block.querySelector(".more.mod-clickable");
        if (moreAbstractButton) {
            moreAbstractButton.click(); // click to get full abstract
        }

        let abstract = super.getAbstract(block, abstractSelector).slice(0, -7);

        if (moreAbstractButton) {
            moreAbstractButton.click(); // click to hide full abstract
        }
        return abstract;
    }

    getTextType(block, textTypeSelector) {
        let textTypeField = super.getTextType(block, textTypeSelector);
        let textType = "";
        if (textTypeField) {
            let isPdfAvailable = textTypeField.getAttribute("data-heap-direct-pdf-link");
            if (isPdfAvailable === "true") {
                textType = "pdf";
            }
        }
        return textType;
    }
}