class MapDataUnderdeeps {

    constructor(cards)
    {
        if (cards === undefined || cards === null)
            cards = [];      
        
        const sitesByTitle = this.getSites(cards); /** all sites with their versions mapped by title */
        const deepsCardList = this.getListOrUnderdeepSites(cards); /** list of underdeep sites */

        this.adjacents = this.createAdjacentSiteList(deepsCardList, sitesByTitle);
    }

    get(_imageList)
    {

        return {
            sites: this.adjacents,
            images: this.createImageList(Object.keys(this.adjacents), _imageList)
        };
    }

    static getEmptyResult()
    {
        return {
            sites: { },
            images: { }
        }
    }

    createImageList(codes, images)
    {
        let res = {};

        for (let code of codes)
        {
            if (images[code] !== undefined)
                res[code] = images[code];
        }

        return res;
    }

    extractImages(cards)
    {
        let images = {};

        for (let card of cards)
        {
            images[card.code] = "/" + card
        }
    }

    /**
     * Get all card codes that are associated to a title (i.e. versions of the same site)
     * @param {JSON} sitesByTitle 
     * @param {String} title 
     * @returns Array
     */
    getCodesByTitle(sitesByTitle, title)
    {
        if (title === undefined || title === "" || sitesByTitle[title] === undefined)
            return [];

        let res = [];
        for (let site of sitesByTitle[title])
            res.push(site.code);

        return res;
    }

    /* 
    
    code => Title

    Title = Array of Codes
    
    
    */

    prepareImages(cards)
    {
        for (let site of cards)
            this.images[site.code] = site.set_code + "/" + site.ImageName;
    }

    /**
     * Identify adajacent sites from card text
     * @param {String} text 
     * @returns Array
     */
    listAdajacentSites(text)
    {
        if (text === undefined || text === null || text === "")
            return [];


        return [];
    }

    /**
     * Check if the card's RPath qualifies as Underdeep site
     * @param {JSON} card 
     * @returns Boolean
     */
    isCandidateUnderdeep(card)
    {
        let val = card.RPath !== undefined ? "" + card.RPath : null;
        return val !== null && (val.indexOf("Under") === 0 || val === "The Under-gates");
    }

    /**
     * Create a map of Cards (by code) and their adjacent sites
     * @param {Array} sites 
     * @param {Map} sitesByTitle
     * @returns Map of arrays
     */
    createAdjacentSiteList(sites, sitesByTitle)
    {
        if (sites === undefined || sites.length === 0)
            return { }

        let surfaces;
        let adjList;
        let targetMap = {};
        for (let site of sites)
        {
            if (targetMap[site.code] === undefined)
                targetMap[site.code] = [];

            adjList = this.extractAdjacentSites(site.text);
            for (let adj of adjList)
            {
                if (!this.addCodesByTitle(adj, sitesByTitle, targetMap[site.code]) &&
                    !this.addCodesByTitle(MapDataUnderdeeps.normalizeString(adj), sitesByTitle, targetMap[site.code]))
                    console.warn("Cannot find site by title " + adj);

                /** check if this site is a surface site */
                surfaces = this.getSurfaceSite(adj, sitesByTitle);
                if (surfaces !== null)
                    this.addSurfaceSites(site.code, surfaces, sitesByTitle, targetMap);
            }
        }

        return this.sortMapByKey(targetMap);
    }

    sortMapByKey(map)
    {
        let res = {};

        for (let key of Object.keys(map).sort())
            res[key] = map[key];

        return res;
    }

    addCodesByTitle(title, sitesByTitle, targetList)
    {
        if (sitesByTitle[title] === undefined)
            return false;

        for (let site of sitesByTitle[title])
        {
            if (!targetList.includes(site.code))
                targetList.push(site.code);
        }

        return true;
    }

    addSurfaceSitesNormalised(code, title, sitesByTitle, targetList)
    {
        if (sitesByTitle[title] === undefined)
            return false;
        
        for (let site of sitesByTitle[title])
        {
            if (targetList[site.code] === undefined)
                targetList[site.code] = [code];
            else if (!targetList[site.code].includes(code))
                targetList[site.code].push(code);
        }
        
        return true;
    }

    addSurfaceSites(code, surfaces, sitesByTitle, targetList)
    {
        for (let surfaceSiteTitle of surfaces)
        {
            let added = this.addSurfaceSitesNormalised(code, surfaceSiteTitle.title, sitesByTitle, targetList);
            added |= this.addSurfaceSitesNormalised(code, MapDataUnderdeeps.normalizeString(surfaceSiteTitle.title), sitesByTitle, targetList);

            if (!added)
                console.warn("Cannot find surface site by title " + surfaceSiteTitle.title);
        }
    }

    static normalizeString(text)
    {
        return text.replace(/\s{2,}/g, " ").replace(/-/g, "").toLowerCase().replace("í", "i").replace("Û", "u").replace("û", "u");
    }

    getSurfaceSite(adjacentSiteTitle, sitesByTitle)
    {
        if (sitesByTitle === null)
            return null;

        const title = adjacentSiteTitle;
        const titleNorm = MapDataUnderdeeps.normalizeString(adjacentSiteTitle);
        
        let res = [];
        if (sitesByTitle[title] !== undefined)
        {
            for (let site of sitesByTitle[title])
            {
                if (!this.isCandidateUnderdeep(site))
                    res.push(site);
            }
        }
       
        if (sitesByTitle[titleNorm] !== undefined)
        {
            for (let site of sitesByTitle[titleNorm])
            {
                if (!this.isCandidateUnderdeep(site))
                    res.push(site);
            }
        }
    
        return res.length === 0 ? null : res;
    }

    /**
     * Create a map of arrays of all SITES by title. 
     * @param {JSON} cards 
     * @returns Map
     */
    getSites(cards)
    {
        let list = { };
        for (let card of cards)
        {
            if (card.type !== "Site")
                continue;

            const title = card.title;
            if (list[title] === undefined)
                list[title] = [card];
            else
                list[title].push(card);

            const titleLower = MapDataUnderdeeps.normalizeString(card.title);
            if (list[titleLower] === undefined)
                list[titleLower] = [card];
            else
                list[titleLower].push(card);
        }

        return list;
    }

    /**
     * Create a list of all underdeep sites from a given list of cards
     * @param {JSON} cards 
     * @returns Array of card json
     */
    getListOrUnderdeepSites(cards)
    {
        let list = [];
        
        for (let card of cards)
        {
            if (this.isCandidateUnderdeep(card))
                list.push(card);
        }

        return list;
    }

    /**
     * Create an array of adjacent sites from a given text
     * @param {String} text Adjacent sites text
     * @returns Array of titles in lowercase
     */
    extractAdjacentSites(text)
    {
        return this.splitAdjacentSites(this.extractAdjacentPart(text));
    }

    /**
     * Create an array of adjacent sites from a komma-separated text
     * @param {String} text 
     * @returns Array of titles in lowercase
     */
    splitAdjacentSites(text)
    {
        if (text === null || text === "" || text === undefined)
            return [];

        let candidates = text.split(",");
        let list = [];
        for (let candidate of candidates)
        {
            let site = this.removeDiceRoll(candidate).replace(/\s{2,}/g, " ").trim();
            if (site !== "" && !list.includes(site))
                list.push(site);              
        }

        return list;
    }

    /**
     * Removes dice roll information from a given text, e.g. The Underdeep (9)
     * @param {String} text 
     * @returns String
     */
    removeDiceRoll(text)
    {
        const offset = text.indexOf("(");
        return offset === -1 ? text : text.substring(0, offset);
    }

    /**
     * Extract the adjacent site text from a given text
     * @param {String} text 
     * @returns Site list in lowercase
     */
    extractAdjacentPart(text)
    {
        if (text === undefined || text === null || text === "")
            return null;

        const pattern = "Adjacent Sites:";
        let offset = text.indexOf(pattern);
        if (offset === -1)
            return null;

        text = text.substring(offset + pattern.length).trim();

        text = this.removeNonAdjacentText(text);
        text = this.removeAttacTextByNumber(text);
        text = this.removeAttackText(text);

        return text.trim();
    }

    /**
     * Remove non-site part that may be similar to "my site (0) (1) Attack by undead, (2) attack by...."
     * @param {String} text 
     * @returns 
     */
    removeAttacTextByNumber(text)
    {
        let offset = text.indexOf(") (");
        if (offset === -1)
            return text;
        else
            return text.substring(0, offset+1).trim();
    }

    /**
     * Remove the non-adjacent site text parts from a given text
     * @param {String} text 
     * @returns Text
     */
    removeNonAdjacentText(text)
    {
        for (let pat of this.getPostAdjacentTextIndicators())
        {
            let offset = text.indexOf(pat);
            if (offset !== -1)
                text = text.substring(0, offset).trim();
        }

        return text;
    }

    /**
     * Remove any strike text
     * @param {String} text 
     * @returns Text
     */
    removeAttackText(text)
    {
        let offset = text.indexOf("---");
        if (offset === -1)
            return text;

        text = text.substring(0, offset);
        
        offset = text.lastIndexOff(")");
        if (offset !== -1)
            return text.substring(0, offset+1);
        else
            return text;
    } 

    /**
     * Get the list of patterns that indicate the non-adjacent site text part
     * @returns Array
     */
    getPostAdjacentTextIndicators()
    {
        return [
            "Playable",
            "Automatic-attacks",
            "Automatic attacks",
            "Special:"
        ]
    }

}

module.exports = MapDataUnderdeeps;
