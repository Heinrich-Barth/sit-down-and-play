

class DiceContainer {
    
    static _jPlayerMap = {};
    static _count = 1;
    static _timeout = 2500;

    constructor()
    {
    }

    getPlayerName(id)
    {
        let sName = DiceContainer._jPlayerMap[id];
        if (typeof sName === "undefined" || sName === "")
            return "Opponent";
        else
            return sName;
    }
    
    create()
    {
        if (document.getElementById("dice_roll") !== null)
            return;

        const jCont = document.createElement("div");
        jCont.setAttribute("id", "dice_roll");
        jCont.innerHTML = '<div class="dice-result-list"></div>';
        document.body.prepend(jCont);
    }

    static createResultElement(id, sName, first, second, total)
    {
        let nFirst = parseInt(first);
        let nSecond = parseInt(second);
        let nTotal = parseInt(total);

        const div = document.createElement("div");
        div.setAttribute("class","dice-content blue-box pos-rel");
        div.setAttribute("id", id);
        div.innerHTML = `<p><img class="dice-icon" src="/media/assets/images/icons/icon-dices.png"> <span class="who">${sName}</span> rolled a <span class="total big">${nTotal}</span><br>
        <img class="dice-image" src="/media/assets/images/dice/minion/dice-${nFirst}.png"><img class="dice-image" src="/media/assets/images/dice/minion/dice-${nSecond}.png"></p>
        <div class="dice-line-countdown"></div>`;
        return div;

    }

    appendResult(id, bIsPlayer, userId, first, second, total)
    {
        const sName = bIsPlayer ? "You" : this.getPlayerName(userId);
        document.getElementById("dice_roll").querySelector(".dice-result-list").prepend(DiceContainer.createResultElement(id, sName, first, second, total));
        return id;
    }

    static removeResult(id)
    {
        const elem = document.getElementById(id);
        if (elem !== null)
            elem.parentNode.removeChild(elem);
    }

    show(bIsPlayer, userId, first, second, total)
    {
        const nId = this.appendResult(++DiceContainer._count, bIsPlayer, userId, first, second, total);
        setTimeout(() => DiceContainer.removeResult(nId), DiceContainer._timeout); 
    }

    static OnShow(e)
    {
        new DiceContainer().show(e.detail.isme, e.detail.user, e.detail.first, e.detail.second, e.detail.total);
    }

    static OnPlayers(e)
    {
        DiceContainer._jPlayerMap = e.detail.map;
    }
};

document.body.addEventListener("meccg-dice-rolled", DiceContainer.OnShow, false);
document.body.addEventListener("meccg-players-updated", DiceContainer.OnPlayers, false);
document.body.addEventListener("meccg-init-ready", () => new DiceContainer().create(), false);

