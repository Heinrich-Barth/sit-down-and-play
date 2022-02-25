
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
        this.isWatcher = document.body.getAttribute("data-is-watcher") === "true";
    }

    /**
     * Add card code to game
     * @param {Boolean} bIsMe 
     * @param {JSON} data  {code: _code, user: userid}
     */
    onPlayFromHand(bIsMe, data)
    {
        this.triggerEvent(data.code, bIsMe, GameEvents.Type_Enter, data);
    }

    onProgressToPhase(e)
    {
        if (e.detail !== "organisation")
            return;
            
        this.autoFlip();
        this.markNonPermanentEvents();
    }

    markNonPermanentEvents()
    {
        const currentTurn = this.getCurrentTurn();
        if (currentTurn === -1)
            return;

        this.forEachCardIn(this.getCardsInStagingArea(), function(card) 
        {
            const sec = card.getAttribute("data-secondary");
            if (sec !== null && sec !== "" && sec.indexOf("permanent event") === -1)
            {
                const turn = GameEvents.getAttributeInteger(card.getAttribute("data-turn"));
                if (turn !== -1 && turn < currentTurn)
                    card.classList.add("mark-red");
            }
        });
    }

    static getAttributeInteger(val)
    {
        try
        {
            if (val !== null && val !== undefined && val !== "")
                return parseInt(val);
        }
        catch (err)
        {
            /** ignore */
        }

        return -1;
    }

    autoFlip()
    {
        const codes = ["Kesä (NW)", "Talvi (NW)"];
        this.forEachCardIn(this.getCardsInStagingArea(), function(card) 
        {
            for (let code of codes)
            {
                if (code === card.getAttribute("data-card-code"))
                {
                    let uuid = card.getAttribute("data-uuid");
                    MeccgApi.send("/game/card/state/reveal", {uuid : uuid, code: code }); 
                }
            }
        });
    }

    getCardsInStagingArea()
    {
        const pArea = document.getElementById("staging-area-player");
        if (pArea === null)
            return null;

        const list = pArea.getElementsByClassName("card");
        return list === null || list.length === 0 ? null : list;
    }

    forEachCardIn(list, fnCall)
    {
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            try
            {
               fnCall(list[i]);
            }
            catch(err)
            {
                console.error(err);
            }
        }
    }

    getCurrentTurn()
    {
        try
        {
            const turn = document.getElementById("game_turns");
            const val = turn === null ? "" : turn.innerText;
            if (val !== "")
                return parseInt(val);
        }
        catch(err)
        {

        }

        return -1;
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
            this.pallandoOwner = this.myId;
        }
        else 
        {
            const list = document.getElementById("opponent_table").querySelectorAll('div[data-card-code="Pallando [H] (TW)"]');
            if (list.length > 0)
            {
                this.pallandoInPlay = true;
                this.pallandoIsMine = false;
                const img = list[0].querySelector("img");
                this.pallandoOwner = img.getAttribute("data-owner");
            }
        }

        this.markNonPermanentEvents();
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

        if ((this.pallandoInPlay || this.isWatcher) &&
            (data.target === "discard" || data.target === "discardpile"))
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
            if (code !== undefined && code !== "" && this.eventCodes[code] !== undefined)
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
            const list = document.querySelectorAll('div[data-card-code="Pallando [H] (TW)"]');
            this.pallandoInPlay = list !== null && list.length > 0;
            if (!this.pallandoInPlay)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-discardpile-hide", { "detail": {} }));
                this.pallandoIsMine = false;
                this.pallandoOwner = "";
            }
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
document.body.addEventListener("meccg-event-phase", GameEvents.INSTANCE.onProgressToPhase.bind(GameEvents.INSTANCE), false);
