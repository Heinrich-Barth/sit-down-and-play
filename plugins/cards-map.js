

let g_Mapdata = {};
let g_Mapregions = {};
let g_Sites = { };

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

    sort : function()
    {
        SiteAlignments.list = Object.keys(SiteAlignments.map);
        SiteAlignments.list.sort();
        /*console.log(SiteAlignments.map);*/
        SiteAlignments.map = null;
    },

    get : function()
    {
        return SiteAlignments.list;
    }

}

const fs = require("fs");

const loadJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));


function isAlignment(card, type) {
    return card["alignment"] === type;
}
function isFallenWizard(card) {
    return card["alignment"] === "Fallen-wizard";
}
function isFallenlord(card) {
    return isAlignment(card, "Fallen/Lord");
}
function isLord(card) {
    return isAlignment(card, "Lord");
}
function isGrey(card) {
    return isAlignment(card, "Grey");
}
function isDragonlord(card) {
    return isAlignment(card, "Dragon-lord");
}
function isWarlord(card) {
    return isAlignment(card, "War-lord");
}
function isElflord(card) {
    return isAlignment(card, "Elf-lord");
}
function isAtanilord(card) {
    return isAlignment(card, "Atani-lord");
}
function isDwarflord(card) {
    return isAlignment(card, "Dwarf-lord");
}
function isHero(card) {
    return isAlignment(card, "Hero") || isAlignment(card, "Dual");
}
function isMinion(card) {
    return isAlignment(card, "Minion") || isAlignment(card, "Dual");
}
function isBalrog(card) {
    return isAlignment(card, "Balrog");
}
function isUnderdeep(card) {
    return card.text !== "" && card.text.indexOf("Adjacent Site") === 0;
}

const MAPDATA = 
{
    replaceMapSiteCodes: function (jMapData, jCards) 
    {
        if (typeof jMapData === "undefined" || typeof jCards === "undefined")
            return jMapData;

        function removeSetInformation(_code) {
            let nPos = _code.lastIndexOf("(");
            if (nPos === -1)
                return _code;
            else
                return _code.substring(0, nPos + 1);
        }

        function createCardMap(jCards) {
            let pCodes = {};
            for (var card of jCards)
                pCodes[card.code] = card;

            return pCodes;
        }

        function requestNewestCard(code, jCards) {
            code = removeSetInformation(code);
            for (var key in jCards) {
                if (key.indexOf(code) === 0)
                    return jCards[key];
            }

            return null;
        }

        function updateCard(jMapCard, jCards) {
            if (typeof jMapCard !== "undefined" && typeof jCards[jMapCard.code] === "undefined") {
                var newCard = requestNewestCard(jMapCard.code, jCards);
                if (newCard !== null) 
                {
                    jMapCard.code = newCard.code;
                    return true;
                }
            }

            return false;
        }

        function haveToRemoveCard(jMapCard, jCards) {
            return typeof jMapCard !== "undefined" && typeof jCards[jMapCard.code] === "undefined";
        }

        function createMissingRegions(jMapData, jCards) {
            var bNew = false;
            var card;
            for (var i in jCards) {
                card = jCards[i];
                if (card.type !== "Region" || typeof jMapData[card.title] !== "undefined")
                    continue;

                jMapData[card.title] = {
                    title: card.title,
                    title_normal: card.normalizedtitle,
                    code: card.code,
                    index: card.index,
                    region_type: "",
                    area: [],
                    sites: {}
                };
                bNew = true;
            }

            return bNew;
        }

        function isTrue(jCard, key) {
            return typeof jCard[key] !== "undefined" && jCard[key] === true;
        }

        function getSiteData(jCard) {
            return {
                code: jCard.code,
                index: jCard.index,
                core_site: jCard.dreamcard !== true,
                minor: isTrue(jCard, "MinorItem"),
                major: isTrue(jCard, "MajorItem"),
                greater: isTrue(jCard, "GreaterItem"),
                rings: isTrue(jCard, "GoldRing"),
                information: isTrue(jCard, "Information"),
                hoard: isTrue(jCard, "Hoard")
            };
        }

        function clearAlignment(sCode) {
            return sCode.replace("-", '').replace("/", "").toLowerCase();
        }

        function createMissingSites(jMapData, jCards) 
        {
            var bNew = false;
            var card;
            for (var i in jCards) 
            {
                card = jCards[i];

                if (card.type !== "Site" || typeof jMapData[card.Region] === "undefined" || jMapData[card.Region].sites === "undefined")
                    continue;

                if (typeof jMapData[card.Region].sites[card.title] === "undefined") {
                    bNew = true;
                    jMapData[card.Region].sites[card.title] = {
                        area: [],
                        underdeep: false
                    };
                }

                var _align = clearAlignment(card.alignment);
                if (_align === "dual") {
                    _align = "hero";
                    if (typeof jMapData[card.Region].sites[card.title][_align] === "undefined") {
                        bNew = true;
                        jMapData[card.Region].sites[card.title][_align] = getSiteData(card);
                    }

                    _align = "minion";
                }

                if (typeof jMapData[card.Region].sites[card.title][_align] === "undefined") {
                    bNew = true;
                    jMapData[card.Region].sites[card.title][_align] = getSiteData(card);
                }
            }

            return bNew;
        }

        jCards = createCardMap(jCards);
        var nReplacedRegion = 0;
        var nReplacedSite = 0;
        var _region;
        var bSortNecessary = false;

        bSortNecessary |= createMissingRegions(jMapData, jCards);
        bSortNecessary |= createMissingSites(jMapData, jCards);

        /* replace old with new sites */
        for (var key in jMapData) 
        {
            _region = jMapData[key];

            if (updateCard(_region, jCards)) {
                bSortNecessary = true;
                nReplacedRegion++;
            }

            for (var title in _region.sites) {
                for (var siteCardKey in _region.sites[title]) {
                    switch (siteCardKey) {
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

                            if (updateCard(_region.sites[title][siteCardKey], jCards)) {
                                bSortNecessary = true;
                                nReplacedSite++;
                            }

                            break;

                        case "has_core_sites":
                            delete _region.sites[title]["has_core_sites"];
                            break;

                        default:
                            break;
                    }
                }
            }
        }

        /* remove old sites */
        for (var key in jMapData) {
            _region = jMapData[key];
            for (var title in _region.sites) {
                for (var siteCardKey in _region.sites[title]) {
                    switch (siteCardKey) {
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

                            if (haveToRemoveCard(_region.sites[title][siteCardKey], jCards)) {
                                bSortNecessary = true;
                                delete _region.sites[title][siteCardKey];
                            }

                            break;

                        default:
                            break;
                    }
                }
            }

            if (!haveToRemoveCard(_region.code, jCards)) {
                bSortNecessary = true;
                delete jMapData[key];
            }
        }

        return jMapData;
    },

    updateMissingMapRegions(jMapData, jCards) 
    {
        if (typeof jMapData === "undefined" || typeof jCards === "undefined")
            return jMapData;

        function updateUnderdeep(jRegion, region, siteTitle, isUnderdeep) {
            if (typeof jRegion[region] === "undefined")
                return;
            else if (typeof jRegion[region].sites[siteTitle] !== "undefined")
                jRegion[region].sites[siteTitle].underdeep = isUnderdeep;
        }

        function updateSite(jRegion, region, siteTitle, hold, isStd, isHero, isMinion, isBalrog) 
        {
            if (typeof jRegion[region] === "undefined" || typeof jRegion[region].sites[siteTitle] === "undefined")
                return;

            if (isHero) {
                jRegion[region].sites[siteTitle].hero["core_site"] = isStd;
                jRegion[region].sites[siteTitle].hero.hold = hold;
            }

            if (isMinion) {
                jRegion[region].sites[siteTitle].minion["core_site"] = isStd;
                jRegion[region].sites[siteTitle].minion.hold = hold;
            }

            if (isBalrog) {
                jRegion[region].sites[siteTitle].balrog["core_site"] = isStd;
                jRegion[region].sites[siteTitle].balrog.hold = hold;
            }
        }
        // 
        function createSiteByAlignment(jRegion, region, siteTitle, _card, sAlignment) {
            if (typeof jRegion[region].sites[siteTitle][sAlignment] === "undefined") {
                jRegion[region].sites[siteTitle][sAlignment] = {};
                jRegion[region].sites[siteTitle][sAlignment].code = _card.code;
                jRegion[region].sites[siteTitle][sAlignment].minor = _card.MinorItem === true;
                jRegion[region].sites[siteTitle][sAlignment].major = _card.MajorItem === true;
                jRegion[region].sites[siteTitle][sAlignment].greater = _card.GreaterItem === true;
                jRegion[region].sites[siteTitle][sAlignment].rings = _card.GoldRing === true;
                jRegion[region].sites[siteTitle][sAlignment].information = _card.Information === true;
                jRegion[region].sites[siteTitle][sAlignment].hoard = !(_card.Hoard === "");
            }

            jRegion[region].sites[siteTitle][sAlignment].index = _card.index;

            /**
             * add site alignment to allow filtering later
             */
            SiteAlignments.add(sAlignment, siteTitle);
        }

        function createifNecessary(_card, jRegion, region, siteTitle) {
            if (typeof jRegion[region] === "undefined" || typeof jRegion[region].sites[siteTitle] === "undefined")
                return;

            if (isHero(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "hero");
            if (isMinion(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "minion");
            if (isBalrog(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "balrog");
            if (isFallenWizard(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "fallenwizard");
            if (isFallenlord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "fallenlord");
            if (isLord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "lord");
            if (isGrey(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "grey");
            if (isDragonlord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "dragonlord");
            if (isWarlord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "warlord");
            if (isElflord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "elflord");
            if (isAtanilord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "atanilord");
            if (isDwarflord(_card))
                createSiteByAlignment(jRegion, region, siteTitle, _card, "dwarflord");
        }

        var jRegion = jMapData;
        var isStd, title, region;
        for (var _card of jCards) {
            if (_card.type !== "Site")
                continue;

            isStd = _card.dreamcard !== true;
            region = _card.Region;
            title = _card.title;

            createifNecessary(_card, jRegion, region, title);
            updateSite(jRegion, region, title, _card.Site, isStd, isHero(_card), isMinion(_card), isBalrog(_card));
            updateUnderdeep(jRegion, region, title, isUnderdeep(_card));
        }

        return jRegion;
    },

    updatePositions : function(jMapData, jPos)
    {
        if (jPos === null)
            return;

        let _item;
        var key, site;

        for (key in jMapData)
        {
            if (typeof jPos[key] !== "undefined")
                jMapData[key]["area"] = jPos[key]
        
            _item = jMapData[key];
            if (typeof _item["sites"] === "undefiened")
                continue;
        
            _item = _item["sites"];        
            for (site in _item)
            {
                if (typeof jPos[site] !== "undefined")
                    _item[site].area = jPos[site];
            }
        }
    },

    create: function (jCards, _posData) 
    {
        let jMapData = this.updateMissingMapRegions(this.replaceMapSiteCodes({}, jCards), jCards);
        this.updatePositions(jMapData, _posData);

        return jMapData;
    },

    createSiteCodeRegionList : function(jMap)
    {
        let jMapSiteRegion = {};
        
        var _keys;
        var _region;
        
        for (let _regionCode in jMap)
        {
            _region = jMap[_regionCode];
            if (_region.area === undefined)
                continue;

            for (var _site in jMap[_regionCode].sites)
            {
                _region = jMap[_regionCode].sites[_site];
                _keys = Object.keys(_region);
                if (_keys === null)
                    continue;

                let len = _keys.length;
                for (let i = 0; i < len; i++)
                {
                    let _key = _keys[i];
                    if (_key !== "area" && _key !== "underdeep")
                        jMapSiteRegion[_region[_key].code] = _regionCode;
                }
            }
        }

        return jMapSiteRegion;
    },

    createSiteImageList: function (jsonCards) 
    {
        function imageListJson(card) 
        {
            let isDCErratum = card.erratum !== undefined && card.erratum === true;
            let isICErratum = card.ice_errata !== undefined && card.ice_errata === true;

            return {
                title: card.title,
                image: card.ImageName,
                errata_dc : isDCErratum,
                errata_ic : isICErratum,
                set_code: card.set_code.toUpperCase()
            };
        }

        let sites = {
            site: {},
            region: {}
        };

        let data, _code, _category;
        for (let card of jsonCards) 
        {
            data = imageListJson(card);

            _category = card.type;
            _code = card.code;

            if (_category === "Region")
                sites.region[_code] = data;
            else if (_category === "Site")
                sites.site[_code] = data;
        }

        return sites;
    }
    
}

exports.init = function(jsonCards)
{
    const jPos = loadJson("./data/map-positions.json");
    g_Mapdata = MAPDATA.create(jsonCards, jPos);
    g_Mapregions = MAPDATA.createSiteCodeRegionList(g_Mapdata);
    g_Sites = MAPDATA.createSiteImageList(jsonCards);

    SiteAlignments.sort();
}

exports.getMapdata = function(_imageList)
{
    return {
        map : g_Mapdata,
        mapregions : g_Mapregions,
        images : _imageList,
        alignments : SiteAlignments.get()
    };
};

exports.getSiteList = () => g_Sites;
