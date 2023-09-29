const Logger = require("../Logger");

class MapDataUnderdeeps {

    constructor(cards)
    {
        if (cards === undefined || cards === null)
            cards = [];      

        const res = this.createAdjacentSiteList(cards);
        this.adjacents = res.adjacents;
        this.alignments = res.alignments;
        Logger.info("\t- " + Object.keys(this.adjacents).length + " sites avialable for underdeeps map in total");
    }

    get(_imageList)
    {
        return {
            sites: this.adjacents,
            alignments: this.alignments,
            images: this.createImageList(Object.keys(this.adjacents), _imageList),
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


    createUnifiedList(list1)
    {
        let result = [];
        
        if (list1 !== undefined)
        {
            for (let elem of list1)
                result.push(elem);
        }
        
        return result;
    }

    /**
     * Create a map of Cards (by code) and their adjacent sites
     * @param {Array} sites 
     * @param {Map} sitesByTitle
     * @returns Map of arrays
     */
    createAdjacentSiteList(cards)
    {
        let alignments = {};
        let targetMap = {};

        for (let card of cards)
        {
            if (card.type !== "Site")
                continue;

            const res = this.createUnifiedList(card.underdeepSites);
            if (res.length > 0)
            {
                targetMap[card.code] = res;
                alignments[card.code] = card.alignment;
            }
        }

        return {
            adjacents: this.sortMapByKey(targetMap),
            alignments: alignments
        }
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
                Logger.warn("Cannot find surface site by title " + surfaceSiteTitle.title);
        }
    }
}

module.exports = MapDataUnderdeeps;
