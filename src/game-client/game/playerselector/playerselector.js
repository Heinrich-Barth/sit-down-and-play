
/**
 * Card Image Files
 * 
 * @param {json} jsonCardList 
 */
class PlayerSelector
{ 
    constructor()
    {
        this._playerHex = {};

        document.body.addEventListener("meccg-players-updated", this.onAddPlayers.bind(this), false);
        document.body.addEventListener("meccg-players-reorder", this.onReorderPlayers.bind(this), false);
    }

    onAddPlayers(e)
    {
        this.addPlayers(e.detail.challengerId, e.detail.map, e.detail.order);        
    }

    onReorderPlayers(e)
    {
        if (this.#reorderHtmlElements(e.detail))
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Player seating rearranged." }));
    }

    #reorderHtmlElements(list)
    {
        const elem = document.getElementById("player_selector");
        if (!Array.isArray(list) || list.length === 0 || elem === null)
            return false;

        const len = list.length;
        for (let i = len -1; i >= 0; i--)
        {
            const _playerIndicator = document.getElementById("player_selector_" + this.player2Hex(list[i]));
            if (_playerIndicator !== null)
                elem.prepend(_playerIndicator);
        }

        return true;
    }

    removePlayerIndicator(userid)
    {
        const sHex = this.player2Hex(userid);
        const elem = document.getElementById("player_selector_" + sHex);
        if (elem !== null)
            elem.parentNode.removeChild(elem);

        GameBuilder.Scoring.removeInGame(sHex);
    }
    
    updateLastSeen(username, isOnline)
    {
        const sHex = this.player2Hex(username);
        const elem = document.getElementById("player_selector_" + sHex);
        if (elem !== null)
            elem.querySelector("span").setAttribute("class", isOnline ? "indicator-green" : "indicator-red");
    }

    player2Hex(sInput)
    {
        if (sInput === "")
            return "";   
        else if (this._playerHex[sInput] === undefined)
            this._playerHex[sInput] = sInput.split("").map(c => c.charCodeAt(0).toString(16)).join("");

        return this._playerHex[sInput];
    }
    
    updateHandSize(username, nCount, nCountPlaydeck)
    {
        if (typeof nCount === "undefined")
            nCount = "?";

        if (typeof nCountPlaydeck === "undefined")
            nCountPlaydeck = "?";

        let pContainer = document.getElementById("player_selector_" + this.player2Hex(username));
        if (pContainer !== null)
        {
            let elem = pContainer.querySelector(".player-handcard-count");
            if (elem !== null)
                elem.innerHTML = nCount;

            elem = pContainer.querySelector(".player-playdeck-count");
            if (elem !== null)
                elem.innerHTML = nCountPlaydeck;
        }
    }

    clearLastSeen()
    {
        const elem = document.getElementById("player_selector");
        const list = elem.getElementsByTagName("span");
        for (let lnk of list)
            lnk.setAttribute("class", "indicator-grey");
    }


    /**
     * Set the current player (player turn!)
     * @param {String} sPlayerId
     * @param {boolean} bIsMe
     * @return {void}
     */
    setCurrentPlayer(sPlayerId, bIsMe)
    {
        this.#removeActivePlayer("act");
        this.#removeActivePlayer("act-hazard");

        this.#setActivePlayer(sPlayerId, bIsMe);
        this.#setActiveHazardPlayer(this.#getHazardPlayerId(sPlayerId));
    }

    #getHazardPlayerId(sPlayerId)
    {
        return typeof MeccgPlayers.getHazardPlayer === "undefined" ? null : MeccgPlayers.getHazardPlayer(sPlayerId);
    }

    #setActiveHazardPlayer(playerInfo)
    {
        if (playerInfo === null)
            return;

        const hazardId = playerInfo.id;
        const isMe = playerInfo.isMe;

        if (hazardId === "")
            return;

        const elem = document.getElementById("player_selector_" + this.player2Hex(hazardId));
        this.#setActivePlayerElement(elem, false);

        if (isMe)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "You are the hazard player." }));
    }

    #setActivePlayer(sPlayerId, bIsMe)
    {
        const jTarget = document.getElementById("player_selector_" + this.player2Hex(sPlayerId));
        if (jTarget !== null)
        {
            this.#setActivePlayerElement(jTarget, true);
            if (!bIsMe) /* show opponents board */
                jTarget.dispatchEvent(new Event('click'));                
        }
    }

    #removeActivePlayer(className)
    {
        const list = this.#getActiveElements(className);
        for (let _elem of list)
            this.#removeActivePlayerAttribs(_elem, className);
    }

    #getActiveElements(className)
    {
        const elem = document.getElementById("player_selector");
        if (elem === null)
            return [];
        else
            return elem.getElementsByClassName(className);
    }

    addScoring(sName, _playerId, sHexId, isMe)
    {
        GameBuilder.Scoring.addInGame(sName, _playerId, sHexId, isMe);
    }

    #addPlayerGetName(sMyId, sName, _playerId)
    {
        if (_playerId === sMyId)
            return "Myself";

        return sName === "" ? _playerId : sName;
    }

    /**
     * Add players to the player indicator box 
     * @param {list} vsPlayersIds
     * @return {void}
     */
    addPlayers(sMyId, jMap, playerListOrder)
    {
        for (let _playerId in jMap)
        {
            const sHexId = this.player2Hex(_playerId);
            if (document.getElementById("player_selector_" + sHexId) !== null) /** indicator already available, so skipp this */
                continue;

            const sName = this.#addPlayerGetName(sMyId, jMap[_playerId], _playerId);
            this.addScoring(sName, _playerId, sHexId, _playerId === sMyId);

            const elemA = document.createElement("a");
            elemA.setAttribute("href", "#");
            elemA.setAttribute("id", "player_selector_" + sHexId);
            elemA.setAttribute("data-hex", sHexId);

            const docGroup = document.createDocumentFragment();

            const txtName = document.createElement("span");
            txtName.setAttribute("class", "indicator-green");
            txtName.innerText = sName;

            const iView = document.createElement("i");
            iView.setAttribute("class", "player-view fa fa-eye");
            iView.setAttribute("title", "Currently visible opponent");

            const iCurrent = document.createElement("i");
            iCurrent.setAttribute("class", "player-active fa fa-pagelines");
            iCurrent.setAttribute("title", "Active Player");

            const iHazard = document.createElement("i");
            iHazard.setAttribute("class", "player-hazard fa fa-fire");
            iHazard.setAttribute("title", "Current Hazard Player");

            const iHand = document.createElement("i");
            iHand.setAttribute("class", "player-handcard-count");
            iHand.setAttribute("title", "cards in hand");
            iHand.innerText = 0;

            const iPlay = document.createElement("i");
            iPlay.setAttribute("class", "player-playdeck-count");
            iPlay.setAttribute("title", "cards in playdeck");
            iPlay.innerText = 0;

            docGroup.append(iCurrent, iHazard, txtName, iView, iHand, iPlay);
            elemA.appendChild(docGroup);

            document.getElementById("player_selector").appendChild(elemA);
            document.getElementById("player_selector_" + sHexId).onclick = this.onLoadOpponentView;
        }

        this.#reorderHtmlElements(playerListOrder)
        
    }
    
    onLoadOpponentView(e)
    {
        const pThis = this;
        const sHex = this.getAttribute("data-hex") || "";
        const jViewContainer = sHex === "" ? null : document.querySelector(".companies[data-player='" + sHex + "']");
        if (jViewContainer !== null)
        {
            ArrayList(document.getElementById("player_selector")).findByClassName("cur").each((_el) => _el.classList.remove("cur"));
            pThis.classList.add("cur");
        
            ArrayList(document.getElementById("opponent_table")).findByClassName("companies").each((_el) => _el.classList.add("hidden"));
            jViewContainer.classList.remove("hidden");
        }
    
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    #setActivePlayerElement(el, isPlayer)
    {
        if (el === null)
            return;

        if (isPlayer)
        {
            el.classList.add("act");
            el.setAttribute("title", "Active player");
        }
        else
        {
            el.classList.add("act-hazard");
            el.setAttribute("title", "Current hazard player");
        }
    }

    #removeActivePlayerAttribs(elem, className)
    {
        if (elem === null)
            return;

        if (className !== "" && elem.classList.contains(className))
            elem.classList.remove(className);

        if (elem.hasAttribute("title"))
            elem.removeAttribute("title");
    }
}
