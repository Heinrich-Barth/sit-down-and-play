
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
    jQuery("#player_selector_" + sHex + " span").attr("class", isOnline ? "indicator-green" : "indicator-red");
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
        nCount = "-";

    if (typeof nCountPlaydeck === "undefined")
        nCountPlaydeck = "-";
    
    let jContainer = jQuery("#player_selector_" + this.player2Hex(username));
    jContainer.find(".player-handcard-count").html(nCount);
    jContainer.find(".player-playdeck-count").html(nCountPlaydeck);
};

PlayerSelector.prototype.clearLastSeen = function()
{
    jQuery(document.getElementById("player_selector")).find("span").each(function()
    {
        jQuery(this).attr("class", "indicator-grey");
    });
};


/**
 * Set the current player (player turn!)
 * @param {String} sPlayerId
 * @param {boolean} bIsMe
 * @return {void}
 */
PlayerSelector.prototype.setCurrentPlayer = function(sPlayerId, bIsMe)
{
    jQuery("#player_selector .act").removeClass("act");

    let jTarget = jQuery("#player_selector_" + this.player2Hex(sPlayerId));
    jTarget.addClass("act");

    if (!bIsMe) // show opponents board
        jTarget.click();
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

        var jContainer = jQuery(document.getElementById("player_selector"));
        var jTarget = jContainer.find("#player_selector_" + sHexId);
        
        /** indicator already available, so skipp this */
        if (jTarget.length === 1)
            continue;

        jContainer.append('<a href="#" id="player_selector_' + sHexId + '" data-hex="' + sHexId + '"><span class="indicator-green">&nbsp;</span> ' + sName + ' <i class="player-handcard-count" title="cards in hand">0</i><i class="player-playdeck-count" title="cards in playdeck">0</i>');
        document.getElementById("player_selector_" + sHexId).onclick = this.onLoadOpponentView;
    }
};

PlayerSelector.prototype.onLoadOpponentView = function(e)
{
    const jThis = jQuery(this);
    const sHex = jThis.attr("data-hex");
    const jViewContainer = sHex === "" ? null : jQuery("#opponent_table .companies[data-player='" + sHex + "']");
    if (jViewContainer !== null && jViewContainer.length !== 0)
    {
        jQuery("#player_selector .cur").removeClass("cur");
        jThis.addClass("cur");
    
        jQuery("#opponent_table .companies").addClass("hidden");
        jViewContainer.removeClass("hidden");

        console.log("onload opponent done");
    }

    e.preventDefault();
    return false;
};