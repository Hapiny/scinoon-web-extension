class GSExtractor extends Extractor {
    constructor(name, blockSelector, verbose=false) {
        super(name, blockSelector, verbose);
    }

    extract(doc) {
		let extractedArticles = [];
        for (let block of this.blocks) {
            let article = {
                ids : [],
            };
            let articleId = undefined;
            let clusterIdField = block.querySelector("h3[class='gs_rt'] > a");
            if (clusterIdField) {
                articleId = clusterIdField.getAttribute("data-clk").match(/$\d+$/);
            }
            article.title        = this.getTitle(block, "h3[class='gs_rt']");
            article.abstractText = this.getAbstract(block, "div[class='gs_rs']");
            article.authors      = this.getAuthors(block, "div[class='gs_a']");
            article.year         = this.getYear(block, "div[class='gs_a']");

            let citesQuery       = this.getCitesQuery(block, "div[class='gs_fl'] > a:nth-child(3)");
            article.textUrl      = this.getTextLink(block, "div.gs_ggs.gs_fl > div > div > a");
            article.textType     = this.getTextType(block, "div.gs_ggs.gs_fl > div > div > a > span.gs_ctg2");
            article.incomingRefs = this.getIncomingRefs(block, "div[class='gs_fl'] > a:nth-child(3)");

            if (citesQuery && !articleId) {
                let clusterIdMatch = /cites=(\d*)/.exec(citesQuery);
                if (clusterIdMatch !== null && clusterIdMatch.length > 1) {
                    articleId = clusterIdMatch[1];
                }
            }
            if (!articleId) {
                continue;
            } else {
                article.ids.push({id : articleId, src : "google-scholar"});
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
            let authorsElems = authorsField[0].innerHTML.split("&nbsp")[0].replace("…", "").trim().split(", ");
            for (let elem of authorsElems) {
                let match_ = elem.match(/(<a href="(.*?)">)?([A-Za-z ]+)(<\/a>)?/);
                if (match_) {
                    let author = {
                        fullName : "",
                        ids : [],
                    };

                    if (match_[3]) {
                        author.fullName = match_[3];
                    }

                    if (match_[2]) {
                        let authorUrl = match_[2];
                        let authorId = "";
                        let authorIdMatch = authorUrl.match(/user=(\w+)&/);
                        if (authorIdMatch) {
                            authorId = authorIdMatch[1];
                        }
                        author.ids.push({
                            id  : authorId,
                            src : window.location.hostname + authorUrl,
                        });
                    }
                    if (author.fullName !== "") {
                        authors.push(author);
                    }
                }
            }
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
        if (citesCountField && citesCountField.innerText) {
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

    getIncomingRefs(block, refencesSelector) {
        let refenrecesField = block.querySelector(refencesSelector);
        let references = {};
        if (!refenrecesField && this.verbose) {
            console.log(`EXTRACTOR (${this.name}): incoming references aren't extracted`);
        } else if (this.verbose) {
            console.log(`EXTRACTOR (${this.name}): extracted incoming references`);
            references.link  = window.location.hostname + this.getCitesQuery(block, refencesSelector);
            references.amout = this.getCitesCount(block, refencesSelector);
            references.ids   = [];
            // console.log(references);
        }
        return references;
    }

    extractArticlesFromAuthorPage() {
        let articleBlocks = document.querySelectorAll(".gsc_a_tr");
        let extractedArticles = [];
        this.blocks = [];
        if (articleBlocks.length) {
            for (let block of articleBlocks) {
                let article = {
                    ids : [],
                }
                let articleId = undefined;
                article.year = super.getYear(block, ".gsc_a_y");
                article.title = super.getTitle(block, ".gsc_a_t > a");
                article.authors = this.getAuthors(block, ".gsc_a_t > div.gs_gray");
                article.incomingRefs = this.getIncomingRefs(block, ".gsc_a_c > a");

                if (article.incomingRefs.link) {
                    article.incomingRefs.link = article.incomingRefs.link.slice(17);
                    let match_ = article.incomingRefs.link.match(/\d+/g);
                    if (match_) {
                        articleId = match_[0];
                    }
                }
                if (!articleId) {
                    continue;
                } else {
                    article.ids.push({id : articleId, src : "google-scholar"});
                    this.blocks.push(block);
                    extractedArticles.push(article);
                }
            }
        }
        return extractedArticles;
    }
}