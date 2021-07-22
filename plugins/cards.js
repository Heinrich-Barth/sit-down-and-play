
const fs = require('fs');
const CardsMeta = require("./cards-meta");

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
function isAlignment(card, type) {
    return card["alignment"] === type;
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

const getRemovableKeysArray = function()
{
    return [
        "Artist",
        "DCpath",
        "Gear",
        "GoldRing",
        "GreaterItem",
        "Haven",
        "Hoard",
        "Home",
        "Information",
        "MajorItem",
        "MinorItem",
        "Non",
        "Path",
        "Playable",
        "Precise",
        "RPath",
        "Race",
        "Rarity",
        "Region",
        "Site",
        "Specific",
        "errata",
        "erratum",
        "extras",
        "flip-title",
        "full_set",
        "gccgSet",
        "released",
        "title-du",
        "title-es",
        "title-fn",
        "title-fr",
        "title-gr",
        "title-it",
        "title-jp",
        "trimCode"
    ];
};

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
    
}

const CARDS = {

    _raw : {},
    _errataIC : [],
    _errataDC : [],

    sort: function () 
    {
        this._raw.sort(function (card1, card2) {
            return card1.title.replace('"', "").localeCompare(card2.title.replace('"', ""), "de-DE");
        });
    },

    stripQuotes : function()
    {
        for (var card of this._raw) 
        {
            card.code = CARDS.removeQuotes(card.code);
            card.title = CARDS.removeQuotes(card.title);
        }
    },

    removeQuotes: function (sCode) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    },

    addIndices: function () 
    {
        var index = 0;
        for (var card of this._raw) 
        {
            card.index = index;
            index++;
        }
    },

    imageListJson: function (card) 
    {
        let isDCErratum = card.erratum !== undefined && card.erratum === true;
        let isICErratum = card.ice_errata !== undefined && card.ice_errata === true;

        if (isICErratum)
            this._errataIC.push(card.set_code.toUpperCase() + "/ice-" + card.ImageName);
        if (isDCErratum)
            this._errataDC.push(card.set_code.toUpperCase() + "/dce-" + card.ImageName);

        return {
            title: card.title,
            image: card.ImageName,
            errata_dc : isDCErratum,
            errata_ic : isICErratum,
            set_code: card.set_code.toUpperCase()
        };
    },

    identifyQuests : function()
    {
        var missingSide = [];
        var images_to_code = { };
        var code_to_images = { };

        var list = {};
        let card;

        for (card of this._raw) 
        {
            if (card.Race.startsWith("Quest-Side-"))
            {
                list[card.code] = "";
                images_to_code[card.ImageName] = card.code;
                code_to_images[card.code] = card.ImageName;
            }
        }   

        let nQuests = 0;
        let _image, _flipCode;
        for (let _code in list) 
        {
            if (code_to_images[_code].startsWith("flip-"))
            {
                _image = code_to_images[_code].replace("flip-", "");
                _flipCode = images_to_code[_image];
            }
            else
            {
                _image = code_to_images[_code];
                _flipCode = images_to_code["flip-" + _image];
            }

            if (_flipCode === undefined || _flipCode === "")
                missingSide.push(_code);

            list[_code] = _flipCode;
            nQuests++;
        }

        const nSize = missingSide.length;

        console.log("\t-Quests identified: " + (nQuests - nSize));
        for (let i = 0; i < nSize; i++)
        {
            delete list[missingSide[i]];
            console.log("\t-removing missing quest " + missingSide[i] + " from quest list.");
        }

        console.log("\t-missing quest removed: " + nSize);
        CARDS._questList = list;
    },

    createImageList: function () 
    {
        var list = {};

        var sites = {
            site: {},
            region: {}
        };

        var data, _code;
        for (var card of this._raw) 
        {
            data = this.imageListJson(card);

            _category = card.type;
            _code = card.code;

            if (_category === "Region")
                sites.region[_code] = data;
            else if (_category === "Site")
                sites.site[_code] = data;

            list[_code] = data;
        }

        console.log("\t-IC errata images available: " + CARDS._errataIC.length);
        console.log("\t-DC errata images available: " + CARDS._errataDC.length);

        CARDS._imageList = list;
        CARDS._siteList = sites;
    },
    
    createAgentList: function () 
    {
        this._agents = [];

        for (var card of this._raw) 
        {
            if (card["type"] === "Character" && card["Secondary"] === "Agent") 
                this._agents.push(card.code);
        }
    },

    loadJson: function (file) 
    {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    },

    updateMapData : function()
    {
        let jPos = this.loadJson("./data/map-positions.json");
        CARDS._mapdata = MAPDATA.create(CARDS._raw, jPos);
        CARDS._mapregions = MAPDATA.createSiteCodeRegionList(CARDS._mapdata);
    },

    temp : function (jMap)
    {
        let _temp = { };

        for (let key in jMap)
        {
            if (jMap[key].area.length !== 0)
                _temp[key] = jMap[key].area;

            for (let sitekey in jMap[key].sites)
            {
                if (jMap[key].sites[sitekey].area.length !== 0)
                    _temp[sitekey] = jMap[key].sites[sitekey].area;
            }

        }

        fs.writeFileSync("./data/map-positions.json", JSON.stringify(_temp, null, '\t'), 'utf-8');
    },

    removeUnusedFields : function()
    {
        const vsUnused = getRemovableKeysArray();

        let rem = 0;
        for (var card of this._raw) 
        {
            vsUnused.forEach(key => 
            {
                if (key !== "" && card[key] !== undefined)
                {
                    delete card[key];
                    rem++;
                }
            });
        }

        if (rem > 0)
            console.log("\t-properties removed from cards: " + rem);
    },

    removeFlavourText : function()
    {
        let rem = 0;

        for (let card of this._raw) 
        {
            if (card.text === undefined || card.text === "" || card.text === null)
                continue;

            let sText = card.text.trim();

            let nLast = sText.lastIndexOf("\"-");
            if (nLast  === -1)
                continue;

            let _can = sText.substring(nLast+2).trim();
            if (!_can.startsWith("Hob") && !_can.startsWith("LotR") && !_can.startsWith("Eliz") && !_can.startsWith("Kuduk Lore"))
                continue;

            let nStart = sText.lastIndexOf("\"", nLast-1);
            if (nStart !== -1)
            {             
                rem++;
                sText = sText.substring(0, nStart).trim();
            }

            card.text = sText;
        }

        if (rem > 0)
            console.log("\t-flavour texts removed from cards: " + rem);
    },

    removeUnwantedCards : function(_raw)
    {
        let count = 0;
        for (let i = _raw.length - 1; i >= 0; i--)
        {
            if (_raw[i].set_code === "MEUL" || _raw[i].code.indexOf(" AL (") !== -1)
            {
                _raw.splice(i, 1);
                count++;
            }
        }

        if (count > 0)
            console.log("\t- cards removed: " + count);

        return _raw;
    },

    integrityCheck : function(_raw)
    {
        let invalids = { };

        const addInvalid = function(card, field)
        {
            if (card[field] !== "" || card[field] === undefined)
                return;

            if (invalids[card.code] === undefined)
                invalids[card.code] = [field];
            else
                invalids[card.code].push(field);
        }

        for (let card of this._raw) 
        {
            if (card.code === "")
                continue;

            addInvalid(card, "ImageName");
            addInvalid(card, "title");
            addInvalid(card, "normalizedtitle");
        }

        console.error("\t-invalid card(s) found: " + Object.keys(invalids).length);
    },

    setup : function(_raw)
    {
        console.log("Setting up cards data.");

        CARDS._raw = this.removeUnwantedCards(_raw);

        this.stripQuotes();
        this.integrityCheck();
        this.sort();
        this.addIndices();
        this.identifyQuests();
        this.createImageList();
        this.createAgentList();
        this.updateMapData();

        this.createTypes();
        this.removeUnusedFields();
        this.removeFlavourText();

        CARDS._errataIC = null;
        CARDS._errataDC = null;
        CARDS._filters = new CardsMeta(CARDS._raw);

        console.log("Cards setup done.");
    },

    _filters: { },
    _questList : { },
    _imageList : { },
    _siteList : { },
    _mapdata : { }, 
    _types : { },
    _agents : [],

    createTypes : function()
    {
        for (var card of this._raw) 
            this._types[card.code] = card["type"];
    },
    
    getCardType : function(code)
    {
        return code === undefined || code === "" || CARDS._types[code] === undefined ? "" : CARDS._types[code];
    }
};

const CardDataProvider = {

    onCardsReceived : function(body)
    {
        try 
        {
            CARDS.setup(JSON.parse(body));
        } 
        catch (error) 
        {
            console.error(error.message);
        };
    },

    loadLocally : function(file)
    {
        try 
        {
            CardDataProvider.onCardsReceived(fs.readFileSync(file, 'utf8'));
            return true;
        } 
        catch (error) 
        {
        };
        
        return false;
    },

    loadFromUrl : function(cardsUrl)
    {
        const https = require('https');
        https.get(cardsUrl,(res) => 
        {
            let body = "";
        
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => CardDataProvider.onCardsReceived(body));
        
        }).on("error", (error) => console.error(error.message));
    },

    load : function(cardsUrl) 
    {
        if (CardDataProvider.loadLocally("./data/cards-raw.json"))
            console.log("Successfully loaded card data from local file.");
        else if (cardsUrl !== undefined && cardsUrl !== "")
            CardDataProvider.loadFromUrl(cardsUrl);
        else
            console.log("Invalid cards url " + cardsUrl);
    }
}

const DeckValidator = 
{
    isEmpty : function(_deck)
    {
        return _deck == undefined || Object.keys(_deck).length === 0;
    },

    copyGenericCards : function(jDeck)
    {
        let res = { };

        for(var k in jDeck)
        {
            let count = jDeck[k];
            if (count < 1)
                continue;
            
            let _code = k.replace(/"/g, '');
            res[_code] = {
                count: count,
			    code: _code,
    			type: CARDS.getCardType(_code)
            }
        }

        return res;
    },

    validate : function(jDeck)
    {
        if (jDeck === undefined || this.isEmpty(jDeck.pool) || this.isEmpty(jDeck.chars) || (this.isEmpty(jDeck.hazards) && this.isEmpty(jDeck.resources)))
            return null;
        else
            return {
                pool: this.copyGenericCards(jDeck.pool),
                sideboard: this.copyGenericCards(jDeck.sideboard),
                chars : this.copyGenericCards(jDeck.chars),
                resources : this.copyGenericCards(jDeck.hazards),
                hazards : this.copyGenericCards(jDeck.resources)
            };
    }
};

exports.validateDeck = (jDeck) => DeckValidator.validate(jDeck);

exports.load = (cardsUrl) => CardDataProvider.load(cardsUrl);

exports.getCards = () =>
{
    return CARDS._raw;
};

exports.isCardAvailable = function(code)
{
    return code !== undefined && code !== "" && CARDS._types[code] !== undefined;
};

exports.getCardType = (code) => CARDS.getCardType(code);

exports.getAgents = function()
{
    return CARDS._agents;
};

exports.getFilters = function()
{
    return CARDS._filters;
};

exports.getImageList = function()
{
    return {
        images: CARDS._imageList,
        fliped : CARDS._questList
    };
};

exports.getSiteList = function()
{
    return CARDS._siteList;
};

exports.getMapdata = function()
{
    return {
        map : CARDS._mapdata,
        mapregions : CARDS._mapregions,
        images : CARDS._imageList
    };
};