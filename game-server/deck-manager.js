var CARD_STATE = 
{
    ready : 0,
    tapped : 90,
    wounded : 180,
    tapped_fixed : 91,
    rot270 : 270            
};

let GAME_TYPE = {
    singleplayer : 0,
    multiplayer : 1,
    arda : 2
}

function newInstance(nType)
{
    /**
     * This manages the decks of given players
     */
    const DECKS = {

        _gameType : nType,

        _uuid_count : 0,

        _cardMap : { },
        
        _siteMap : { },

        _deck : { },

        reset : function()
        {
            this._uuid_count = 0;
            this._cardMap = { };
            this._deck = { };
        },
        
        restoreSavedGame : function(jDecks)
        {
            this.reset();
            this._uuid_count = jDecks.uuid_count;
            this._cardMap = jDecks.cardMap;
            
            let nSize = jDecks.deck;
            if (nSize === 0)
                return false;
            
            let _deck;
            let _id;
            for (var i = 0; i < nSize; i++)
            {
                _deck = jDecks[i];
                _id = _deck.id;
                if (_id === "")
                    return false;
                else
                    DECKS._deck[_id] = _deck;
            }
            
            return true;
        },
        
        saveCurrentGame : function()
        {
            let jData = 
            {
                uuid_count : this._uuid_count,
                cardMap : this._cardMap,
                deck : [],
                siteMap : this._siteMap
            };
            
            for (var key in DECKS._deck) 
                jData.deck.push(DECKS._deck[key]);

            return jData;
        },

        addDeck : function(playerId, jsonDeck, listAgents, gameCardProvider)
        {
            let deck = require("./deck.js").create(playerId, jsonDeck, listAgents, DECKS._gameType, DECKS._cardMap, gameCardProvider);
            deck.shuffle();
            this._deck[playerId] = deck;
            return true;
        },
        
        addCardsToSideboardDuringGame : function(playerId, jsonDeck, listAgents, gameCardProvider)
        {
            if (typeof DECKS._deck[playerId] === "undefined")
                console.log("Could not find deck " + playerId);

            return typeof DECKS._deck[playerId] === "undefined" ? -1 : DECKS._deck[playerId].registerCards(playerId, jsonDeck, listAgents, DECKS._cardMap, gameCardProvider);
        },

        getCards : {

            hand : function(playerId)
            {
                if (typeof DECKS._deck[playerId] === "undefined")
                    return [];
                else
                    return DECKS._deck[playerId].handCards;
            },

            sideboard : function(playerId)
            {
                if (typeof DECKS._deck[playerId] === "undefined")
                    return [];
                else
                    return DECKS._deck[playerId].sideboard;
            },

            discardpile : function(playerId)
            {
                if (typeof DECKS._deck[playerId] === "undefined")
                    return [];
                else
                    return DECKS._deck[playerId].discardPile;
            },

            playdeck : function(playerId)
            {
                if (typeof DECKS._deck[playerId] === "undefined")
                    return [];
                else
                    return DECKS._deck[playerId].playdeck;
            },

            victory : function(playerId)
            {
                if (typeof DECKS._deck[playerId] === "undefined")
                    return [];
                else
                    return DECKS._deck[playerId].victory;
            }
        },

        getPlayerDeck : function(playerId)
        {
            if (typeof DECKS._deck[playerId] === "undefined")
            {
                console.log("Cannot find deck of player " + playerId);
                return null;
            }
            else
                return DECKS._deck[playerId];
        },

        flipCard : function(uuid)
        {
            if (typeof DECKS._cardMap[uuid] === "undefined")
                return false;

            DECKS._cardMap[uuid].revealed = !DECKS._cardMap[uuid].revealed;
            return DECKS._cardMap[uuid].revealed;
        },
        
        _clearSitesTappedByPlaer : function(playerId)
        {
            if (typeof playerId !== "undefined" && typeof DECKS._siteMap[playerId] !== "undefined")
            {
                DECKS._siteMap[playerId] = {};
                console.log("cleared tapped sites.")
            }
        },
        
        _tapSiteState : function(playerId, code, bTapped)
        {
            if (typeof DECKS._siteMap[playerId] === "undefined")
                DECKS._siteMap[playerId] = {};
            
            if (bTapped && typeof DECKS._siteMap[playerId][code] === "undefined")
                DECKS._siteMap[playerId][code] = true;
            else if (!bTapped && typeof DECKS._siteMap[playerId][code] !== "undefined")
                delete DECKS._siteMap[playerId][code];
        },
        
        _siteIsTapped : function(playerId, code)
        {
            if (typeof playerId === "undefined" || playerId === "" || typeof code === "undefined" || code === "")
                return false;
            else
                return typeof DECKS._siteMap[playerId] !== "undefined" && typeof DECKS._siteMap[playerId][code] !== "undefined";
        },

        _getTappedSites : function(playerId)
        {
            if (typeof playerId === "undefined" || playerId === "")
            {
                console.log("invalid player id");
                return { };
            }
            else if (typeof DECKS._siteMap[playerId] === "undefined")
            {
                console.log("Player does not have site map");
                return { };
            }
            else
                return  DECKS._siteMap[playerId];
        },

        _setCardState : function(uuid, nState)
        {
            if (typeof DECKS._cardMap[uuid] === "undefined")
                return -1;
            else
            {
                DECKS._cardMap[uuid].state = nState;
                return nState;
            }
        },

        _isCardState : function(uuid, nState)
        {
            if (typeof DECKS._cardMap[uuid] === "undefined")
                return false;
            else
                return DECKS._cardMap[uuid].state === nState;
        },

        tapCard : function(uuid)
        {
            return this._setCardState(uuid, CARD_STATE.tapped);
        },

        woundCard : function(uuid)
        {
            return this._setCardState(uuid, CARD_STATE.wounded);
        },

        tapCardFixed : function(uuid)
        {
            return this._setCardState(uuid, CARD_STATE.tapped_fixed);
        },

        readySite : function(playerId, code)
        {
            return this._tapSiteState(playerId, code, false);
        },
        
        clearPlayerSites : function(playerId)
        {
            return this._clearSitesTappedByPlaer(playerId);
        },
        
        tapSite : function(playerId, code)
        {
            return this._tapSiteState(playerId, code, true);
        },
        
        siteIsTapped : function(playerId, code)
        {
            return this._siteIsTapped(playerId, code);
        },

        getTappedSites : function(playerId)
        {
            return this._getTappedSites(playerId);
        },
        
        readyCard : function(uuid)
        {
            return this._setCardState(uuid, CARD_STATE.ready);
        },
        triceTapCard : function(uuid)
        {
            return this._setCardState(uuid, CARD_STATE.rot270);
        },

        isStateWounded : function(uuid)
        {
            return this._isCardState(uuid, CARD_STATE.wounded);
        },

        isStateTapped : function(uuid)
        {
            return this._isCardState(uuid, CARD_STATE.tapped);
        },

        getFullPlayerCard : function(uuid)
        {
            if (uuid === "" || typeof DECKS._cardMap[uuid] === "undefined")
                return null;
            else
                return DECKS._cardMap[uuid];
        },

        dumpCards : function(playerId)
        {
        }
    };
    
    return DECKS;
}

exports.setupDecks = function() 
{
    return newInstance(GAME_TYPE.multiplayer);
};

