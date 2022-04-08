class GameBase {

    constructor(_MeccgApi, _Chat, playboardManager)
    {
        this.apis = {
            chat : _Chat,
            meccgApi : _MeccgApi
        };

        this.playboardManager = playboardManager;
        this._adminUser = "";
        this.player_phase =  "start";
        this.started = null;
        this.bSingle = false;
    }

    restorePlayerPhase(phase, _turn, _current)
    {
        this.player_phase = phase;
    }

    getMeccgApi()
    {
        return this.apis.meccgApi;
    }

    _getList(userid, obj)
    {
        var list = [];
        if (obj === "sideboard")
            list = this.getPlayboardManager().GetCardsInSideboard(userid);
        else if (obj === "discardpile" || obj === "discard")
            list = this.getPlayboardManager().GetCardsInDiscardpile(userid);
        else if (obj === "playdeck")
            list = this.getPlayboardManager().GetCardsInPlaydeck(userid);
        else if (obj === "victory")
            list = this.getPlayboardManager().GetCardsInVictory(userid);
        else if (obj === "hand")
            list = this.getPlayboardManager().GetCardsInHand(userid);
        else
            console.log("unknown target " + obj);
        
        return list;
    }

    getPlayboardManager()
    {
        return this.playboardManager;
    }

    save()
    {
        let data = {};

        data.meta = {
            phase : this.player_phase,
            admin : this._adminUser,
            arda : this.isArda(),
            players : null
        };
        
        data.playboard = this.getPlayboardManager().Save();
        data.scoring = this.scoring.save();

        return data;
    }

    getCardCode(uuid, sDefault)
    {
        var card = this.getPlayboardManager().GetCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    getCharacterCode(uuid, sDefault)
    {
        var card = this.getPlayboardManager().GetCharacterCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    getPlayboardDataObject()
    {
        return this.playboardManager.GetData();
    }

    getFirstCompanyCharacterCode(uuid, sDefault)
    {
        var card = this.getPlayboardManager().GetFirstCompanyCharacterCardByCompanyId(uuid);
        return card !== null ? card.code : sDefault;
    }

    setGameAdminUser(id)
    {
        if (id !== undefined && id !== "" && this._adminUser === "")
            this._adminUser = id;
    }

    reset()
    {
        if (this.getPlayboardManager() !== null)
            this.getPlayboardManager().reset();

        this.player_phase = "start";
        this.started = 0;
    }

    setupNewGame()
    {
        return true;
    }

    restore(playboard)
    {
        return this.getPlayboardManager().Restore(playboard);
    }
    
    getPhase ()
    {
        return this.player_phase;
    }

    getTappedSites(userid)
    {
        return this.getPlayboardManager().GetTappedSites(userid);
    }

    getGameOnline()
    {
        if (this.started === null)
        {
            this.started = new Date();
            return 0;
        }
        else
            return new Date().getTime() - this.started;
    }

    setPhase(sVal)
    {
        this.player_phase = sVal;
    }

    dumpDeck()
    {
        /** deprecated */
    }

    getHost()
    {
        return this._adminUser;
    }

    isSinglePlayer()
    {
        return this.bSingle;
    }

    setSinglePlayer(bSingle)
    {
        this.bSingle = bSingle;
    }

    isArda()
    {
        return false;
    }

    publishChat(userid, message)
    {
        if (message !== "")
            this.apis.chat.send(userid, message);
    }

    publishToPlayers(route, userid, obj)
    {
        this.apis.meccgApi.publish(route, userid, obj);
    }

    addCardsToGameDuringGame(playerId, cards)
    {
        return this.getPlayboardManager().AddDeckCardsToSideboard(playerId, cards);
    }

    importCardDuringGame(playerId, code, bAsCharacter)
    {
        return this.getPlayboardManager().ImportCardsToHand(playerId, code, bAsCharacter);
    }

    replyToPlayer(path, socket, obj)
    {
        this.apis.meccgApi.reply(path, socket, obj);
    }

    getDeckManager()
    {
        return this.getPlayboardManager().getDecks();
    }

    getCardList(list)
    {
        if (list === null || list === undefined || list.length === 0)
            return [];
        else
            return this.getPlayboardManager().getCardList(list)
    }

    updateCardOwnership(userid, card)
    {
        if (card !== null && userid !== "")
            this.getPlayboardManager().UpdateOwnership(userid, card);
    }

    /**
     * Init game routes
     */
    init()
    {
        this.setPhase("start")
    }

    onAfterInit(pEventManager)
    {
        if (pEventManager)
            pEventManager.trigger("register-game-endpoints", this.getMeccgApi());
    }

}

module.exports = GameBase;