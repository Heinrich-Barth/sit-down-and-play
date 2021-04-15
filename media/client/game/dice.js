

const DiceContainer = {
    
    _timeout : 2500,
    _jPlayerMap : { },
    _count : 1,
    _isReady : false,

    getPlayerName : function(id)
    {
        let sName = DiceContainer._jPlayerMap[id];
        if (typeof sName === "undefined" || sName === "")
            return "Opponent";
        else
            return sName;
    },
    
    init : function()
    {
        if (DiceContainer._isReady)
            return;

        const jCont = jQuery("<div>", {
            id: "dice_roll"
        });

        jCont.html('<div class="dice-result-list"></div>');
        jQuery("body").prepend(jCont);
        DiceContainer._isReady = true;
     },

    hideDices : function(nId)
    {
        jQuery("#dice_roll .dice-result-list div[data-id='" + nId + "']").remove();
    },

    appendResult : function(id, bIsPlayer, userId, first, second, total)
    {
        let nFirst = parseInt(first);
        let nSecond = parseInt(second);
        let nTotal = parseInt(total);

        if (nFirst < 1 || nSecond < 1 || nFirst > 6 || nSecond > 6)
            return;

        let sName = bIsPlayer ? "You" : DiceContainer.getPlayerName(userId);
        sName = DiceContainer.getPlayerName(userId);

        let sHtml = `<div class="dice-content blue-box pos-rel" data-id="{id}">
            <p>
            <img class="dice-icon" src="/media/assets/images/icons/icon-dices.png"> <span class="who">${sName}</span> rolled a <span class="total big">${nTotal}</span><br>
            <img class="dice-image" src="/media/assets/images/dice/minion/dice-${nFirst}.png"><img class="dice-image" src="/media/assets/images/dice/minion/dice-${nSecond}.png"></p>
            <div class="dice-line-countdown"></div>
        </div>`;

        jQuery("#dice_roll .dice-result-list").prepend(sHtml.replace("{id}", id))
    },

    requestId : function()
    {
        DiceContainer._count++;
        return DiceContainer._count;
    },
    
    show : function(bIsPlayer, userId, first, second, total)
    {
        const nId = DiceContainer.requestId();
        DiceContainer.appendResult(nId, bIsPlayer, userId, first, second, total);

        setTimeout(function()
        {
            const _id = nId; /* avoid closures, hopefully */
            DiceContainer.hideDices(_id);

        }, DiceContainer._timeout); 
    },

    onShow : function(e)
    {
        DiceContainer.show(e.detail.isme, e.detail.user, e.detail.first, e.detail.second, e.detail.total);
    },

    onPlayers : function(e)
    {
        DiceContainer._jPlayerMap = e.detail;
    }
};

document.body.addEventListener("meccg-dice-rolled", DiceContainer.onShow, false);
document.body.addEventListener("meccg-dice-players", DiceContainer.onPlayers, false);

jQuery(document).ready(DiceContainer.init);