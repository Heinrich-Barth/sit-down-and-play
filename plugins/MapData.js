const Logger = require("../Logger");

const isAlignment = (card, type) => card["alignment"] === type;
const isFallenWizard = (card) => isAlignment(card, "Fallen-wizard");
const isFallenlord = (card) => isAlignment(card, "Fallen/Lord");
const isLord = (card) => isAlignment(card, "Lord");
const isGrey = (card) => isAlignment(card, "Grey");
const isDragonlord = (card) => isAlignment(card, "Dragon-lord");
const isWarlord = (card) => isAlignment(card, "War-lord");
const isElflord = (card) => isAlignment(card, "Elf-lord");
const isAtanilord = (card) => isAlignment(card, "Atani-lord");
const isDwarflord = (card) => isAlignment(card, "Dwarf-lord");
const isHero = (card) => isAlignment(card, "Hero") || isAlignment(card, "Dual");
const isMinion = (card) => isAlignment(card, "Minion") || isAlignment(card, "Dual");
const isBalrog = (card) => isAlignment(card, "Balrog");
const isUnderdeep = (card) => card.isUnderdeep;

const SiteAlignments = {
    list : null,
    map: { },

    add : function(sAlignment, siteTitle)
    {
        if (SiteAlignments.map[sAlignment] === undefined)
            SiteAlignments.map[sAlignment] = [siteTitle];
        else
            SiteAlignments.map[sAlignment].push(siteTitle);
    },

    get : function()
    {
        let list = Object.keys(SiteAlignments.map);
        list.sort();
        delete SiteAlignments.map;
        return list;
    }

}

class MapData 
{
    constructor()
    {
        this.alignments = [];
        this.mapData = {};
        this.images = {};
        this.mapRegions = {};
        this.sets = {};
    }

    haveToRemoveCard(jMapCard, jCards) 
    {
        return typeof jMapCard !== "undefined" && typeof jCards[jMapCard.code] === "undefined";
    }
    
    clearAlignment(sCode) 
    {
        return sCode.replace("-", '').replace("/", "").toLowerCase();
    }

    clear()
    {
        this.alignments = [];
        this.mapData = {};
        this.images = {};
        this.mapRegions = {};
        this.alignments = [];
        this.sets = {};
    }

    getPositionFileContent(positionFile)
    {
        try
        {
            if (positionFile !== "")
            {
                const fs = require("fs");
                return JSON.parse(fs.readFileSync(positionFile, 'utf8'));
            }
        }
        catch(err)
        {
            Logger.error(err);
        }

        return  { };
    }

    init(jsonCards, positionFile)
    {
        const jPos = this.getPositionFileContent(positionFile);
        this.mapData = this.create(jsonCards, jPos);
        this.createSiteCodeRegionList(this.mapData);
        this.createSiteImageList(jsonCards);
        this.alignments = SiteAlignments.get();
    }

    getMapdata()
    {
        return {
            map : this.mapData,
            mapregions : this.mapRegions,
            alignments : this.alignments,
            sets: this.sets
        };
    }

    createCardMap(jCards) 
    {
        let pCodes = {};
        for (let card of jCards)
            pCodes[card.code] = card;

        return pCodes;
    }

    requestNewestCard(codeFull, jCards) 
    {
        const code = this.removeSetInformation(codeFull);
        for (let key in jCards) 
        {
            if (key.indexOf(code) === 0)
                return jCards[key];
        }

        return null;
    }

    removeSetInformation(_code) 
    {
        const nPos = _code.lastIndexOf("(");
        if (nPos === -1)
            return _code;
        else
            return _code.substring(0, nPos + 1);
    }

    getSiteData(jCard) 
    {
        return {
            code: jCard.code,
            set_code : jCard.set_code,
        };
    }

    updateCard(jMapCard, jCards) 
    {
        if (typeof jMapCard !== "undefined" && typeof jCards[jMapCard.code] === "undefined") 
        {
            const newCard = this.requestNewestCard(jMapCard.code, jCards);
            if (newCard !== null) 
            {
                jMapCard.code = newCard.code;
                return true;
            }
        }

        return false;
    }
    
    createMissingRegions(jMapData, jCards) 
    {
        let added = 0;
        let count = 0;
        for (let i in jCards) 
        {
            let card = jCards[i];
            if (card.type === "Region" && card.full_set !== undefined)
            {
                count++;
                if (typeof jMapData[card.title] === "undefined")
                {
                    this.sets[card.set_code] = card.full_set;
                    added++;
                    jMapData[card.title] = {
                        title: card.title,
                        code: card.code,
                        region_type: this.requireRegionType(card),
                        dreamcard : card.dreamcard === true,
                        set_code : card.set_code,
                        area: [],
                        sites: {}
                    };
                }
            }
        }

        for (let i in jCards) 
        {
            let card = jCards[i];
            if (card.type === "Site" && card.full_set !== undefined)
            {
                count++;
                this.sets[card.set_code] = card.full_set;
                if (typeof jMapData[card.Region] === "undefined")
                {
                    added++;
                    this.sets[card.set_code] = card.full_set;
                    jMapData[card.Region] = {
                        title: card.Region,
                        code: card.Region + " (" + card.set_code + ")",
                        region_type: this.requireRegionType(card),
                        dreamcard : card.dreamcard === true,
                        set_code : card.set_code,
                        area: [],
                        sites: {}
                    };
                }
            }
        }

        if (count > 0)
        {
            Logger.info("\t- " + count + " regions available.");
            Logger.info("\t- " + added + " missing regions added to map data.");
        }
    }


    requireRegionTypeByValue(val)
    {
        if (val === undefined || val === null || val === "")
            return "";
    
        switch(val.toLowerCase())
        {
            case "boarder-land":
            case "border-land":
            case "{b}":
                return "bl";
            case "double coastal sea":
                return "cscs";
            case "triple coastal seas":
                return "cscscs";
            case "coastal sea":
            case "{c}":
                return "cs";
            case "dark-domain":
            case "{d}":
                return "dd";
            case "double desert":
            case "desert":
                return "de";
            case "double wilderness":
                return "wiwi";
            case "wilderness":
            case "{w}":
                return "wi";
            case "free-domain":
            case "{f}":
                return "fd";
            case "jungle":
                return "ju";
            case "shadow-land":
            case "{s}":
                return "sl";
            default: 
                return "";
        }   
    }

    requireRegionType(card)
    {
        if (card === null || card === undefined)
            return "dd";

        const val1 = this.requireRegionTypeByValue(card.RPath);
        if(val1 !== "")
            return val1;

        const val2 = this.requireRegionTypeByValue(card.region_type);
        if (val2 !== "")
            return val2;

        return "dd";
    }

    createMissingSites(jMapData, jCards) 
    {
        let count = 0;
        for (let i in jCards) 
        {
            let card = jCards[i];
            if (card.type !== "Site")
                continue;

            count++;
            if (typeof jMapData[card.Region] === "undefined")
            {
                Logger.warn("Region " + card.Region + " is missing in map data");
                continue;
            }
            else if (typeof jMapData[card.Region].sites === "undefined")
            {
                Logger.warn("Region " + card.Region + " does not have sites property.");
                continue;
            }
            else if (typeof jMapData[card.Region].sites[card.title] === "undefined") 
            {
                jMapData[card.Region].sites[card.title] = {
                    area: [],
                    underdeep: false
                };
            }

            let _align = this.clearAlignment(card.alignment);
            if (_align === "dual") 
            {
                _align = "hero";
                if (typeof jMapData[card.Region].sites[card.title][_align] === "undefined") 
                    jMapData[card.Region].sites[card.title][_align] = this.getSiteData(card);

                _align = "minion";
            }

            if (typeof jMapData[card.Region].sites[card.title][_align] === "undefined") 
                jMapData[card.Region].sites[card.title][_align] = this.getSiteData(card);
        }

        if (count > 0)
            Logger.info("\t- " + count + " sites available");
    }

    replaceMapSiteCodesReplaceWithNew(jCards, region)
    {            
        for (let title in region.sites) 
        {
            for (let siteCardKey in region.sites[title]) 
            {
                switch (siteCardKey) 
                {
                    case "hero":
                    case "minion":
                    case "balrog":
                    case "fallenwizard":
                    case "fallenlord":
                    case "lord":
                    case "grey":
                    case "dragonlord":
                    case "warlord":
                    case "elflord":
                    case "atanilord":
                    case "dwarflord":

                        this.updateCard(region.sites[title][siteCardKey], jCards);
                        break;

                    case "has_core_sites":
                        delete region.sites[title]["has_core_sites"];
                        break;

                    default:
                        break;
                }
            }
        }
    }

    isRemovableSiteKey(siteCardKey)
    {
        switch (siteCardKey) 
        {
            case "hero":
            case "minion":
            case "balrog":
            case "fallenwizard":
            case "fallenlord":
            case "lord":
            case "grey":
            case "dragonlord":
            case "warlord":
            case "elflord":
            case "atanilord":
            case "dwarflord":
                return true;

            default:
                return false;
        }
    }

    replaceMapSiteCodesRemoveOld(jMapData, jCards)
    {
        /* remove old sites */
        let _region;
        for (let key in jMapData) 
        {
            _region = jMapData[key];
            for (let title in _region.sites) 
            {
                for (let siteCardKey in _region.sites[title]) 
                {
                    if (this.isRemovableSiteKey(siteCardKey) && this.haveToRemoveCard(_region.sites[title][siteCardKey], jCards))
                        delete _region.sites[title][siteCardKey];
                }
            }

            if (!this.haveToRemoveCard(_region.code, jCards)) 
                delete jMapData[key];
        }
    }

    replaceMapSiteCodes(jMapData, jCards) 
    {
        if (typeof jMapData === "undefined" || typeof jCards === "undefined")
            return jMapData;

        jCards = this.createCardMap(jCards);

        this.createMissingRegions(jMapData, jCards);
        this.createMissingSites(jMapData, jCards);

        /* replace old with new sites */
        for (let key in jMapData) 
        {
            let _region = jMapData[key];

            this.updateCard(_region, jCards)
            this.replaceMapSiteCodesReplaceWithNew(jCards, _region);
        }

        this.replaceMapSiteCodesRemoveOld(jMapData, jCards);
        return jMapData;
    }

    createSiteByAlignment(jRegion, region, siteTitle, _card, sAlignment) 
    {
        if (typeof jRegion[region].sites[siteTitle][sAlignment] === "undefined") 
        {
            jRegion[region].sites[siteTitle][sAlignment] = {};
            jRegion[region].sites[siteTitle][sAlignment].code = _card.code;
        }
        
        SiteAlignments.add(sAlignment, siteTitle);
    }

    updateUnderdeep(jRegion, region, siteTitle, bUnderdeep, isDreamcard) 
    {
        if (jRegion[region] !== undefined && jRegion[region].sites[siteTitle] === undefined)
        {
            jRegion[region].sites[siteTitle].underdeep = bUnderdeep;
            jRegion[region].sites[siteTitle].dreamcard = isDreamcard;
        }
    }

    updateSite(jRegion, region, siteTitle, hold, _isHero, _isMinion, _isBalrog, isDreamcard) 
    {
        if (typeof jRegion[region] === "undefined" || typeof jRegion[region].sites[siteTitle] === "undefined")
            return;

        if (_isHero) {
            jRegion[region].sites[siteTitle].hero.hold = hold;
            jRegion[region].sites[siteTitle].hero.dreamcard = isDreamcard;
        }

        if (_isMinion) {
            jRegion[region].sites[siteTitle].minion.hold = hold;
            jRegion[region].sites[siteTitle].minion.dreamcard = isDreamcard;
        }

        if (_isBalrog) {
            jRegion[region].sites[siteTitle].balrog.hold = hold;
            jRegion[region].sites[siteTitle].balrog.dreamcard = isDreamcard;
        }
    }

    createifNecessary(_card, jRegion, region, siteTitle) 
    {
        if (typeof jRegion[region] === "undefined" || typeof jRegion[region].sites[siteTitle] === "undefined")
            return;

        if (isHero(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "hero");
        if (isMinion(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "minion");
        if (isBalrog(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "balrog");
        if (isFallenWizard(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "fallenwizard");
        if (isFallenlord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "fallenlord");
        if (isLord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "lord");
        if (isGrey(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "grey");
        if (isDragonlord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "dragonlord");
        if (isWarlord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "warlord");
        if (isElflord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "elflord");
        if (isAtanilord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "atanilord");
        if (isDwarflord(_card))
            this.createSiteByAlignment(jRegion, region, siteTitle, _card, "dwarflord");
    }

    updateMissingMapRegions(jMapData, jCards) 
    {
        if (typeof jMapData === "undefined" || typeof jCards === "undefined")
            return jMapData;

        let jRegion = jMapData;
        for (let _card of jCards) 
        {
            if (_card.type === "Site")
            {
                let region = _card.Region;
                let title = _card.title;
                let isDreamcard = _card.dreamcard === true;

                this.createifNecessary(_card, jRegion, region, title);
                this.updateSite(jRegion, region, title, this.identifySiteHoldType(_card), isHero(_card), isMinion(_card), isBalrog(_card), isDreamcard);
                this.updateUnderdeep(jRegion, region, title, isUnderdeep(_card), isDreamcard);
            }
        }

        return jRegion;
    }

    identifySiteHoldType(card)
    {
        if (card.site_type === undefined)
            return card.Site;
            
        switch(card.site_type.replace("{", "").replace("}", "").toUpperCase())
        {
            case "F":
                return "Free-hold";
            case "R":
                return "Ruins & Lairs";
            case "B":
                return "Border-hold";
            case "D":
                return "Dark-hold";
            case "S":
                return "Shadow-hold";
            case "H":
                return "Haven";
            default:
                Logger.warn("Unknown site type: " + card.site_type);
                break;

        }

        return "";
    }

    updatePositions(jMapData, jPos)
    {
        if (jPos === null || jPos === undefined)
            return jMapData;

        let posRegions = 0;
        let posAdded = 0;
        for (let key in jMapData)
        {
            if (typeof jPos[key] !== "undefined")
            {
                jMapData[key]["area"] = jPos[key]
                posRegions++;
            }
        
            let _item = jMapData[key];
            if (typeof _item["sites"] === "undefined")
                continue;
        
            _item = _item["sites"];        
            for (let site in _item)
            {
                if (typeof jPos[site] !== "undefined")
                {
                    _item[site].area = jPos[site];
                    posAdded++;
                }
            }
        }

        if (posAdded > 0)
            Logger.info("\t- " + posAdded + " site(s) in " + posRegions + " region(s) added to the map.");

        return jMapData;
    }

    lowerCasePositionKeys(json)
    {
        let res = { };

        for (let key in json)
            res[key.toLowerCase()] = json[key];

        return res;
    }

    create(jCards, _posData) 
    {
        let jMapData = this.updateMissingMapRegions(this.replaceMapSiteCodes({}, jCards), jCards);
        return this.updatePositions(jMapData, this.lowerCasePositionKeys(_posData));
    }

    createSiteCodeRegionList(jMap)
    {
        for (let _regionCode in jMap)
        {
            let _region = jMap[_regionCode];
            if (_region.area !== undefined)
                this.createSiteCodeFromRegionSies(jMap[_regionCode].sites, _regionCode);
        }
    }

    createSiteCodeFromRegionSies(jSites, regionCode)
    { 
        for (let _site in jSites)
        {
            let _sites = jSites[_site];
            const _keys = Object.keys(_sites);
            const len = _keys.length;
            for (let i = 0; i < len; i++)
            {
                const _key = _keys[i];
                if (_key !== "area" && _key !== "underdeep")
                    this.mapRegions[_sites[_key].code] = regionCode;
            }
        }
    }

    imageListJson(card) 
    {
        let isDCErratum = card.ImageNameErrataDC !== undefined && card.ImageNameErrataDC !== "";

        return {
            title: card.title,
            image: card.ImageName,
            image_dc: isDCErratum ? card.ImageNameErrataDC : "",
            errata_dc : isDCErratum,
            errata_ic : false,
            set_code: card.set_code.toUpperCase()
        };
    }

    createSiteImageList(jsonCards) 
    {
        this.images.site = {};
        this.images.region = {};

        for (let card of jsonCards) 
        {
            if (card.type === "Region")
                this.images.region[card.code] = this.imageListJson(card);
            else if (card.type === "Site")
                this.images.site[card.code] = this.imageListJson(card);
        }
    }

    getSiteList()
    {
        return this.images;
    }
    
}

module.exports = MapData;