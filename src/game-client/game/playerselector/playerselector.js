
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
    }

    onAddPlayers(e)
    {
        this.addPlayers(e.detail.challengerId, e.detail.map);        
    }

    removePlayerIndicator(userid)
    {
        const sHex = this.player2Hex(userid);
        const elem = document.getElementById("player_selector_" + sHex);
        if (elem !== null)
            elem.parentNode.removeChild(elem);
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
        let list = document.getElementById("player_selector").getElementsByClassName("act");
        if (list === null)
            list = [];

        for (let _elem of list)
            this.removeActivePlayer(_elem);

        const jTarget = document.getElementById("player_selector_" + this.player2Hex(sPlayerId));
        if (jTarget !== null)
        {
            this.setActivePlayer(jTarget);
            if (!bIsMe) /* show opponents board */
                jTarget.dispatchEvent(new Event('click'));                
        }            
    }


    /**
     * Add players to the player indicator box 
     * @param {list} vsPlayersIds
     * @return {void}
     */
    addPlayers(sMyId, jMap)
    {
        for (let _playerId in jMap)
        {
            let sName = jMap[_playerId];
            if (sName === "")
                sName = _playerId;
            
            if (_playerId === sMyId)
                sName = "You";
            
            const sHexId = this.player2Hex(_playerId);
            if (document.getElementById("player_selector_" + sHexId) === null) /** indicator already available, so skipp this */
            {
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

                const iHand = document.createElement("i");
                iHand.setAttribute("class", "player-handcard-count");
                iHand.setAttribute("title", "cards in hand");
                iHand.innerText = 0;

                const iPlay = document.createElement("i");
                iPlay.setAttribute("class", "player-playdeck-count");
                iPlay.setAttribute("title", "cards in playdeck");
                iPlay.innerText = 0;

                docGroup.append(iCurrent, txtName, iView, iHand, iPlay);
                elemA.appendChild(docGroup);

                document.getElementById("player_selector").appendChild(elemA);
                document.getElementById("player_selector_" + sHexId).onclick = this.onLoadOpponentView;
            }        
        }
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

    setActivePlayer(_el)
    {
        _el.classList.add("act");
        _el.setAttribute("title", "Active player");
    }
    
    removeActivePlayer(_el)
    {
        _el.classList.remove("act");
        if (_el.hasAttribute("title"))
            _el.removeAttribute("title");
    }
}

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/client/game/playerselector/playerselector.css?t=" + Date.now());
    document.head.appendChild(styleSheet);
})();