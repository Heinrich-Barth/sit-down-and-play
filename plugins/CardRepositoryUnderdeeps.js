class CardRepositoryUnderdeeps 
{
    create(cards)
    {
        const surfaceSites = this.createAdjacentSiteList(this.getListOrUnderdeepSites(cards), this.getSites(cards));
        this.updateSurfaceSites(cards, surfaceSites);
    }

    updateSurfaceSites(cards, mapSurfaceSites)
    {
        let count = 0;
        for (let card of cards) 
        {
            if (card.type === "Site" && mapSurfaceSites[card.code] !== undefined)
            {
                card.underdeepSites = this.cloneArray(mapSurfaceSites[card.code]);
                count++;
            }
        }

        if (count > 0)
            console.info("\t- " + count + " surface sites available");
    }

    cloneArray(input)
    {
        let list = [];
        for (let elem of input)
        {

            list.push(elem);
        }

        return list;
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

    /**
     * Check if the card's RPath qualifies as Underdeep site
     * @param {JSON} card 
     * @returns Boolean
     */
    isCandidateUnderdeep(card)
    {
        const val = card.RPath !== undefined ? "" + card.RPath : "";
        return val.startsWith("Under") || val === "The Under-gates";
    }

    identifyUnderdeeps(cards)
    {
        let count = 0;
        for (let card of cards) 
        {
            if (card.type === "Site")
            {
                card.isUnderdeep = card.text.toLowerCase().startsWith("adjacent site") || card.RPath.startsWith("Under-");
                if (card.isUnderdeep)
                    count++;
            }
        }

        console.info("\t- " + count + " underdeeps");
    }
    
    getListOfCodes(cards)
    {
        let list = [];
        
        for (let card of cards)
            list.push(card.code);
            
        return list;
    }

    assignSurfaceSite(sites, code, targetMap)
    {
        for (let siteCode of sites)
        {
            if (targetMap[siteCode] === undefined)
                targetMap[siteCode] = [code];
            else if (!targetMap[siteCode].includes(code))
                targetMap[siteCode].push(code);
        }
    }

    /**
     * Create a map of Cards (by code) and their adjacent sites
     * @param {Array} sites 
     * @param {Map} sitesByTitle
     * @returns Map of arrays
     */
    createAdjacentSiteList(sitesUnderdeeps, sitesByTitle)
    {
        if (sitesUnderdeeps.length === 0)
        {
            console.info("\t- no underdeep sites available.");
            return { };
        }

        console.info("\t- creating underdeep adjacent site list.");

        let surfaceSites = { };
        let nAssigned = 0;
        const listOfCodes = this.getListOfCodes(sitesUnderdeeps);
        for (let site of sitesUnderdeeps)
        {
            let adjList = this.extractAdjacentSites(site.text);
            if (adjList.length === 0)
                continue;

            let connectedSitesList = [];
            let connectedSurfaces = [];

            for (let adj of adjList)
            {
                this.addCodesByTitle(adj, sitesByTitle, connectedSitesList);
                this.addCodesByTitle(this.normalizeString(adj), sitesByTitle, connectedSitesList);
                this.addSurfaceSites(adj, sitesByTitle, listOfCodes, connectedSurfaces);
            }

            if (connectedSitesList.length === 0 && connectedSurfaces.length)
            {
                console.warn(site.code + " has neither surface nor connected underdeep sites");
                continue;
            }

            if (connectedSitesList.length > 0 || connectedSurfaces.length > 0)
            {
                nAssigned++;
                site.underdeepSites = [];
                for (let elem of connectedSitesList)
                {
                    if (!site.underdeepSites.includes(elem))
                        site.underdeepSites.push(elem);
                }

                for (let elem of connectedSurfaces)
                {
                    if (!site.underdeepSites.includes(elem))
                        site.underdeepSites.push(elem);
                }

                if (connectedSurfaces.length > 0)
                    this.assignSurfaceSite(connectedSurfaces, site.code, surfaceSites);

                site.underdeepSites.sort();
            }
        }

        console.info("\t- " + nAssigned + " sites have been assigned surface and/or adajacent sites");
        return surfaceSites;
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
            return;

        for (let site of sitesByTitle[title])
        {
            if (!targetList.includes(site))
                targetList.push(site);
        }
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

    normalizeString(text)
    {
        return text.replace(/\s{2,}/g, " ").replace(/-/g, "").toLowerCase().replace("í", "i").replace("Û", "u").replace("û", "u");
    }

    addSurfaceSites(adjacentSiteTitle, sitesByTitle, listOfCodes, tagetList)
    {
        if (sitesByTitle === null)
            return;

        const title = adjacentSiteTitle;
        const titleNorm = this.normalizeString(adjacentSiteTitle);
        
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

        for (let code of res)
        {
            if (!listOfCodes.includes(code) && !tagetList.includes(code))
                tagetList.push(code);
        }
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
                list[title] = [card.code];
            else
                list[title].push(card.code);

            const titleLower = this.normalizeString(card.title);
            if (list[titleLower] === undefined)
                list[titleLower] = [card.code];
            else
                list[titleLower].push(card.code);
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
            if (card.type !== "Site")
                continue;

            if (this.isCandidateUnderdeep(card))
            {
                card.isUnderdeep = true;
                list.push(card);
            }
            else
                card.isUnderdeep = false;
                
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

module.exports = CardRepositoryUnderdeeps;