class SSExtractor extends Extractor {
    constructor(name, blockSelector, verbose=false) {
        super(name, blockSelector, verbose);
    }

    extract(doc) {
        let extractedArticles = [];
        // in function extract guaranteed that the page is loaded
        this.getBlocks();

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
			
			article.authors      = this.getAuthors(block, ".author-list__link");
            article.textUrl      = this.getTextLink(block, ".icon-button.paper-link");
            article.textType     = this.getTextType(block, ".icon-button.paper-link");
            article.title        = this.getTitle(block, ".search-result-title");
			article.year         = this.getYear(block, '[data-selenium-selector="paper-year"]');
			article.abstractText = this.getAbstract(block, ".abstract");
            article.bibtex       = this.getBibtex(block, 
                ".formatted-citation.formatted-citation--style-bibtex",
                '[data-selenium-selector="cite-link"]',
                ".close-modal-button")
            article.publicationSource = this.getPublicationSource(block, '[data-selenium-selector="venue-metadata"]');

            extractedArticles.push(article);
        }
		return extractedArticles;
    }

    getAuthors(block, authorsSelector, moreAuthorsBtn=".more-authors-label") {
        let authors = []
        let moreAuthorsButton = block.querySelector(moreAuthorsBtn);
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

        moreAuthorsButton = block.querySelector(moreAuthorsBtn);
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

    getAbstract(block, abstractSelector, moreBtnSelector=".more.mod-clickable", trunc=7) {
        let moreAbstractButton = block.querySelector(moreBtnSelector);
        if (moreAbstractButton) {
            moreAbstractButton.click(); // click to get full abstract
        }

        let abstract = super.getAbstract(block, abstractSelector).slice(0, -trunc);

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

    getBibtex(block, bibtexSelector, openBibtexBtnSelector, closeBibtexBtnSelector) {
        let openBibtexBtn = block.querySelector(openBibtexBtnSelector);
        if (openBibtexBtn) {
            openBibtexBtn.click();
        } else {
            console.log("No open BTN!!!!!");
            return;
        }

        let bibtexField = document.querySelector(bibtexSelector);
        let bibtex = "";
        if (bibtexField) {
            bibtex = bibtexField.innerText;
        } else {
            console.log("No bibtex field!!!!!");
            console.log(block);
            console.log(bibtexSelector);
            return;
        }

        let closeBibtexBtn = document.querySelector(closeBibtexBtnSelector);
        if (closeBibtexBtn) {
            closeBibtexBtn.click();
        } else {
            console.log("No close BTN!!!!!");
            return;
        }
        if (!bibtex && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): bibtex isn't extracted`);
        } else if (this.bibtex) {
            console.log(`EXTRACTOR (${this.name}): extracted bibtex = ${bibtex.slice(0, 20)}...`);
        }
        return bibtex;
    }

    getPublicationSource(block, sourceSelector) {
        let sourceField = block.querySelector(sourceSelector);
        let source = {
            name : "",
        };
        if (!sourceField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): publication source isn't extracted`);
        } else if (this.verbose) {
            source.name = sourceField.innerText;
            console.log(`EXTRACTOR (${this.name}): extracted publication source = ${source.name}`);
        }
        return source;
    }

    extractArticleFromPage(articleBlockSelector=".fresh-paper-detail-page__header") {
        let article = {
            ids : [{
                id  : window.location.href.split("/").slice(-1)[0],
                src : "semantic-scholar"
            }],
        };
        let articleBlock = document.querySelector(articleBlockSelector);
        this.blocks = [articleBlock];
        let doiField = articleBlock.querySelector('[data-selenium-selector="paper-doi"]');
        if (doiField) {
            article.doi = doiField.innerText;
        }
        article.title        = this.getTitle(articleBlock, '[data-selenium-selector="paper-detail-title"]');
        article.abstractText = this.getAbstract(articleBlock, 
                ".text-truncator.abstract__text.text--preline", 
                '[data-selenium-selector="text-truncator-toggle"]', 5)
        article.authors      = this.getAuthors(articleBlock, ".author-list__link.author-list__author-name");
        article.year         = this.getYear(articleBlock, '[data-selenium-selector="paper-year"]');
        article.bibtex = this.getBibtex(articleBlock, 
            ".formatted-citation.formatted-citation--style-bibtex",
            '[data-selenium-selector="cite-link"]',
            ".close-modal-button")
        article.incomingRefs = this.getArticleReferencesFromPage('[data-heap-nav="citing-papers"]', 
            "CITATIONS",
            '[data-selenium-selector="cited-by"]',
            ".citation__title > a");
        article.outgoingRefs = this.getArticleReferencesFromPage('[data-heap-nav="references"]', 
            "REFERENCES",
            '[data-selenium-selector="reference"]',
            ".citation__title > a");
        article.similarArticlesRefs = this.getArticleReferencesFromPage('[data-heap-nav="similar-papers"]',
            "SIMILAR PAPERS",
            '[data-selenium-selector="related-papers-list"]',
            'a[data-selenium-selector="title-link"]',
            false);
        article.publicationSource = this.getPublicationSource(articleBlock, '[data-selenium-selector="venue-metadata"]');
        return [article];
    }

    getArticleReferencesFromPage(referencesSelector, replaceWord, referencesBlockSelector, refSelector, withAmount=true) {
        let referencesField = document.querySelector(referencesSelector);
        let result = {};
        if (!referencesField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): refences aren't extracted`);
        } else if (this.verbose) {
            console.log(`EXTRACTOR (${this.name}): extracted refenreces`);
            result.link = window.location.href + referencesField.getAttribute("href");
            if (withAmount) {
                result.amount = parseInt(referencesField.innerText.replace(replaceWord, "").match(/\d/g).join(""));
            }
            result.ids = [];
            let referenceBlock = document.querySelector(referencesBlockSelector);
            if (referenceBlock) {
                let references = referenceBlock.querySelectorAll(refSelector);
                if (references.length) {
                    if (!withAmount) {
                        result.amount = references.length;
                    }
                    for (let i = 0; i < references.length; i++) {
                        let refUrl = references[i].getAttribute("href");
                        result.ids.push({
                            id  : refUrl.split("/").slice(-1)[0],
                            src : window.location.hostname + refUrl,
                        });
                    }
                }
            }
            console.log(result);
        }
        return result;
    }
}