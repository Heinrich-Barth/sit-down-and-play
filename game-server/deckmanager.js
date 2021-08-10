const CARD_STATE = 
{
    ready : 0,
    tapped : 90,
    wounded : 180,
    tapped_fixed : 91,
    rot270 : 270            
};


class DeckManager {

    constructor()
    {
        this._uuid_count = 0;
        this._cardMap = { };
        this._siteMap = { };
        this._deck = { };
        this._handManager = null;
    }

    creatHandManager()
    {
        throw "please overwrite!";
    }

    isArda()
    {
        return false;
    }

    reset()
    {
        this._uuid_count = 0;
        this._cardMap = { };
        this._deck = { };
    }
    
    restoreSavedGame(jDecks)
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
                this._deck[_id] = _deck;
        }
        
        return true;
    }

    getPlayers()
    {
        return Object.keys(this._deck);
    }
    
    saveCurrentGame()
    {
        let jData = 
        {
            uuid_count : this._uuid_count,
            cardMap : this._cardMap,
            deck : [],
            siteMap : this._siteMap
        };
        
        for (var key in this._deck) 
            jData.deck.push(this._deck[key]);

        return jData;
    }

    newDeckInstance(playerId)
    {
        throw "Overwrite newDeckInstance";
    }

    addDeck(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        let deck = this.newDeckInstance(playerId)
        deck.addDeck(jsonDeck, listAgents, this._cardMap, gameCardProvider);
        deck.shuffle();
        this._deck[playerId] = deck;
        return deck;
    }

    deckCount()
    {
        return Object.keys(this._deck).length;
    }
    
    addCardsToSideboardDuringGame(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        if (typeof this._deck[playerId] === "undefined")
            console.log("Could not find deck " + playerId);

        return typeof this._deck[playerId] === "undefined" ? -1 : this._deck[playerId].registerCardsToSideboard(jsonDeck, listAgents, this._cardMap, gameCardProvider);
    }

    getCards() 
    {
        if (this._handManager === null)
            this._handManager = this.creatHandManager();
        
        return this._handManager;
    }

    getPlayerDeck(playerId)
    {
        if (typeof this._deck[playerId] === "undefined")
        {
            console.log("Cannot find deck of player " + playerId);
            return null;
        }
        else
            return this._deck[playerId];
    }

    flipCard(uuid)
    {
        if (typeof this._cardMap[uuid] === "undefined")
            return false;

        this._cardMap[uuid].revealed = !this._cardMap[uuid].revealed;
        return this._cardMap[uuid].revealed;
    }
    
    _clearSitesTappedByPlaer(playerId)
    {
        if (typeof playerId !== "undefined" && typeof this._siteMap[playerId] !== "undefined")
        {
            this._siteMap[playerId] = {};
            console.log("cleared tapped sites.")
        }
    }
    
    _tapSiteState(playerId, code, bTapped)
    {
        if (typeof this._siteMap[playerId] === "undefined")
        this._siteMap[playerId] = {};
        
        if (bTapped && typeof this._siteMap[playerId][code] === "undefined")
            this._siteMap[playerId][code] = true;
        else if (!bTapped && typeof this._siteMap[playerId][code] !== "undefined")
            delete this._siteMap[playerId][code];
    }
    
    _siteIsTapped(playerId, code)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof code === "undefined" || code === "")
            return false;
        else
            return typeof this._siteMap[playerId] !== "undefined" && typeof this._siteMap[playerId][code] !== "undefined";
    }

    _getTappedSites(playerId)
    {
        if (typeof playerId === "undefined" || playerId === "")
        {
            console.log("invalid player id");
            return { };
        }
        else if (typeof this._siteMap[playerId] === "undefined")
        {
            console.log("Player does not have site map");
            return { };
        }
        else
            return  this._siteMap[playerId];
    }

    _setCardState(uuid, nState)
    {
        if (typeof this._cardMap[uuid] === "undefined")
            return -1;
        else
        {
            this._cardMap[uuid].state = nState;
            return nState;
        }
    }

    _isCardState(uuid, nState)
    {
        if (typeof this._cardMap[uuid] === "undefined")
            return false;
        else
            return this._cardMap[uuid].state === nState;
    }

    tapCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.tapped);
    }

    woundCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.wounded);
    }

    tapCardFixed(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.tapped_fixed);
    }

    readySite(playerId, code)
    {
        return this._tapSiteState(playerId, code, false);
    }
    
    clearPlayerSites(playerId)
    {
        return this._clearSitesTappedByPlaer(playerId);
    }
    
    tapSite(playerId, code)
    {
        return this._tapSiteState(playerId, code, true);
    }
    
    siteIsTapped(playerId, code)
    {
        return this._siteIsTapped(playerId, code);
    }

    getTappedSites(playerId)
    {
        return this._getTappedSites(playerId);
    }
    
    readyCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.ready);
    }
    triceTapCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.rot270);
    }

    isStateWounded (uuid)
    {
        return this._isCardState(uuid, CARD_STATE.wounded);
    }

    isStateTapped(uuid)
    {
        return this._isCardState(uuid, CARD_STATE.tapped);
    }

    getFullPlayerCard(uuid)
    {
        if (uuid === "" || typeof this._cardMap[uuid] === "undefined")
            return null;
        else
            return this._cardMap[uuid];
    }

    dumpCards(playerId)
    {
    }
};

module.exports = DeckManager;