
class GameEvents
{
    static INSTANCE = new GameEvents();

    static Type_Enter = 1;
    static Type_Leave = 2;

    constructor()
    {
        this.pallandoInPlay = false;
        this.pallandoIsMine = false;
        this.pallandoOwner = "";
        this.eventCodes = { };
        this.myId = g_sUserId;
    }

    /**
     * Add card code to game
     * @param {Boolean} bIsMe 
     * @param {JSON} data  {code: _code, user: userid}
     */
    onPlayFromHand(bIsMe, data)
    {
        this.triggerEvent("Pallando [H] (TW)", bIsMe, GameEvents.Type_Enter, data);
    }

    /**
     * Check for things if the board has been restored
     */
    onBoardRestored()
    {
        if (document.getElementById("player_companies").querySelectorAll('div[data-card-code="Pallando [H] (TW)"]').length > 0)
        {
            this.pallandoInPlay = true;
            this.pallandoIsMine = true;
        }
        else if (document.getElementById("opponent_table").querySelectorAll('div[data-card-code="Pallando [H] (TW)"]').length > 0)
        {
            this.pallandoInPlay = true;
            this.pallandoIsMine = false;
        }
    }

    /**
     * 
     * @param {Boolean} bIsMe 
     * @param {JSON} data {list: [{code: 'Pipe (DF)', owner: 'db13dcdb-50f2-44c5-a431-}], target: obj.target, source: obj.source} 
     */
    onMoveToPile(bIsMe, data)
    {
        if (data.list === undefined || data.list.length === 0)
            return;

        for (let _data of data.list)
        {
            const _d = {
                code : _data.code,
                user : _data.owner,
                target: data.target, 
                source: data.source
            };
            this.triggerEvent(_data.code, bIsMe, GameEvents.Type_Leave, _d);
        }

        if ((data.target === "discard" || data.target === "discardpile") && this.pallandoInPlay)
        {
            const card = data.list[data.list.length-1];
            if (card.owner !== this.pallandoOwner)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-discardpile-add", { "detail": {
                    code: card.code,
                    owner: card.owner
                }}));
            }
        }
    }

    registerEventCode(code, callback)
    {
        this.eventCodes[code] = callback;
    }

    triggerEvent(code, isMe, type, data)
    {
        try
        {
            if (this.eventCodes[code] !== undefined)
                this.eventCodes[code](isMe, type, data);
        }
        catch (err)
        {
            console.error(err);
        }
    }

    setupEvents()
    {
        this.registerEventCode("Pallando [H] (TW)", this.onEventPallando.bind(this));
    }

    onEventPallando(isMe, type, data)
    {
        if (GameEvents.Type_Leave === type)
        {
            const list = document.querySelectorAll('div[data-card-code="' + data.code +'"]');
            this.pallandoInPlay = list !== null && list.length > 0;
            if (!this.pallandoInPlay)
                document.body.dispatchEvent(new CustomEvent("meccg-discardpile-hide", { "detail": {} }));
            
        }
        else
        {
            this.pallandoIsMine = isMe;
            this.pallandoOwner = data.user;
            this.pallandoInPlay = true;
        }
    }
}

GameEvents.INSTANCE.setupEvents();

MeccgApi.addListener("/game/event/fromHand", GameEvents.INSTANCE.onPlayFromHand.bind(GameEvents.INSTANCE));
MeccgApi.addListener("/game/event/cardmoved", GameEvents.INSTANCE.onMoveToPile.bind(GameEvents.INSTANCE));

document.body.addEventListener("meccg-api-connected", GameEvents.INSTANCE.onBoardRestored.bind(GameEvents.INSTANCE), false);
