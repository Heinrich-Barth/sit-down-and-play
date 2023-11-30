const Logger = require("../Logger");
const EventManager = require("../EventManager");

class GameBase {

    #playboardManager;

    #adminUser = "";
    #player_phase =  "start";
    #created = Date.now();
    #bSingle = false;
    #started = null;

    constructor(pMeccgApi, pChat, pPlayboardManager)
    {
        this.apis = {
            chat : pChat,
            meccgApi : pMeccgApi
        };

        this.#playboardManager = pPlayboardManager;
    }

    globalRestoreGame(_userid, _socket, data)
    {
        if (typeof data.game.meta.gameduration === "undefined" || isNaN(data.game.meta.gameduration))
            return;

        try
        {
            this.#created -= parseInt(data.game.meta.gameduration);
        }
        catch (err)
        {
            Logger.error(err);
        }
    }            

    getGameCreated()
    {
        return this.#created;
    }

    getGameDuration()
    {
        return Date.now() - this.#created;
    }

    restorePlayerPhase(phase, _turn, _current)
    {
        this.#player_phase = phase;
    }

    getMeccgApi()
    {
        return this.apis.meccgApi;
    }

    _getList(userid, obj)
    {
        let list = [];
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
        else if (obj === "sharedvicotory")
            list = this.getPlayboardManager().GetCardsInVictoryShared(userid);
        else if (obj === "outofplay")
            list = this.getPlayboardManager().GetCardsInOutOfPlay();
        else
            Logger.warn("unknown target card list " + obj);
        
        return list;
    }

    getPlayboardManager()
    {
        return this.#playboardManager;
    }

    save()
    {
        let data = {};

        data.meta = {
            phase : this.#player_phase,
            admin : this.#adminUser,
            arda : this.isArda(),
            gameduration: this.getGameDuration(),
            players : null
        };
        
        data.playboard = this.getPlayboardManager().Save();
        return data;
    }

    getCardCode(uuid, sDefault)
    {
        const card = this.getPlayboardManager().GetCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    getCharacterCode(uuid, sDefault)
    {
        const card = this.getPlayboardManager().GetCharacterCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    getPlayboardDataObject()
    {
        return this.#playboardManager.GetData();
    }

    getFirstCompanyCharacterCode(uuid, sDefault)
    {
        const card = this.getPlayboardManager().GetFirstCompanyCharacterCardByCompanyId(uuid);
        return card !== null ? card.code : sDefault;
    }

    setGameAdminUser(id)
    {
        if (id !== undefined && id !== "" && this.#adminUser === "")
            this.#adminUser = id;
    }

    reset()
    {
        if (this.getPlayboardManager() !== null)
            this.getPlayboardManager().reset();

        this.#player_phase = "start";
        this.#started = 0;
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
        return this.#player_phase;
    }

    getTappedSites(userid)
    {
        return this.getPlayboardManager().GetTappedSites(userid);
    }

    getGameOnline()
    {
        if (this.#started === null)
        {
            this.#started = new Date();
            return 0;
        }
        else
            return new Date().getTime() - this.#started;
    }

    setPhase(sVal)
    {
        this.#player_phase = sVal;
    }

    dumpDeck()
    {
        /** deprecated */
    }

    getHost()
    {
        return this.#adminUser;
    }

    isSinglePlayer()
    {
        return this.#bSingle;
    }

    setSinglePlayer(bSingle)
    {
        this.#bSingle = bSingle;
    }

    isArda()
    {
        return false;
    }

    replyToPlayer(path, socket, obj)
    {
        this.apis.meccgApi.reply(path, socket, obj);
    }

    publishGameLogNextPlayer(message)
    {
        this.apis.chat.gameLogNextPlayer(message);
    }

    publishChat(userid, message, saveGameLog = false)
    {
        if (message !== "")
            this.apis.chat.sendMessage(userid, message, saveGameLog);
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

    importCardsToGame(playerId, code, bAsCharacter)
    {
        return this.getPlayboardManager().ImportCardsToGame(playerId, code, bAsCharacter);
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

    onAfterInit()
    {
        EventManager.trigger("register-game-endpoints", this.getMeccgApi());
    }

}

module.exports = GameBase;