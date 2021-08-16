
/**
 * Card Image Files
 * 
 * @param {json} jsonCardList 
 */
function PlayerSelector() 
{ 
    this._playerHex = {};
}

PlayerSelector.prototype.updateLastSeen = function(username, isOnline)
{
    const sHex = this.player2Hex(username);
    document.getElementById("player_selector_" + sHex).querySelector("span").setAttribute("class", isOnline ? "indicator-green" : "indicator-red");
};

PlayerSelector.prototype.player2Hex = function (sInput)
{
    if (sInput === "")
        return "";   
    else if (typeof this._playerHex[sInput] === "undefined")
        this._playerHex[sInput] = sInput.split("").map(c => c.charCodeAt(0).toString(16)).join("");

    return this._playerHex[sInput];
};

PlayerSelector.prototype.updateHandSize = function(username, nCount, nCountPlaydeck)
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
};

PlayerSelector.prototype.clearLastSeen = function()
{
    const elem = document.getElementById("player_selector");
    const list = elem.getElementsByTagName("span");
    for (let i = 0; i < list.length; i++)
        list[i].setAttribute("class", "indicator-grey");
};


/**
 * Set the current player (player turn!)
 * @param {String} sPlayerId
 * @param {boolean} bIsMe
 * @return {void}
 */
PlayerSelector.prototype.setCurrentPlayer = function(sPlayerId, bIsMe)
{
    let list = document.getElementById("player_selector").getElementsByClassName(".act");
    if (list === null)
        list = [];

    for (let i = 0; i< list.length; i++)
        list[i].classList.remove("act");

    let jTarget = document.getElementById("player_selector_" + this.player2Hex(sPlayerId));
    jTarget.classList.add("act");

    if (!bIsMe) /* show opponents board */
        jTarget.dispatchEvent(new Event('click'));
};

/**
 * Add players to the player indicator box 
 * @param {list} vsPlayersIds
 * @return {void}
 */
PlayerSelector.prototype.addPlayers = function(sMyId, jMap)
{
    let sHexId;
    let sName;
    
    for (let _playerId in jMap)
    {
        sName = jMap[_playerId];
        if (sName === "")
            sName = _playerId;
        
        if (_playerId === sMyId)
            sName = "You";
        
        sHexId = this.player2Hex(_playerId);
        if (_playerId.indexOf("<") !== -1 || _playerId.indexOf(">") !== -1)
            _playerId = sHexId;

        if (document.getElementById("player_selector_" + sHexId) === null) /** indicator already available, so skipp this */
        {
            const elemA = document.createElement("a");
            elemA.setAttribute("href", "#");
            elemA.setAttribute("id", "player_selector_" + sHexId);
            elemA.setAttribute("data-hex", sHexId);
            elemA.innerHTML = `<span class="indicator-green">&nbsp;</span>${sName} <i class="player-handcard-count" title="cards in hand">0</i><i class="player-playdeck-count" title="cards in playdeck">0</i>`;
            document.getElementById("player_selector").appendChild(elemA);
            document.getElementById("player_selector_" + sHexId).onclick = this.onLoadOpponentView;
        }        
    }
};

PlayerSelector.prototype.onLoadOpponentView = function(e)
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
};