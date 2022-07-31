

class DiceContainer {
    
    static _jPlayerMap = {};
    static _count = 1;
    static _timeout = 5500;
    static _folder = "black";
    static _fallback = "/media/client/game/dice"

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
        const type = document.body.getAttribute("data-dice");
        if (type !== null && type !== "" && type.indexOf(".") === -1)
            this._folder = type;

        if (document.getElementById("dice_roll") !== null)
            return;

        const jCont = document.createElement("div");
        jCont.setAttribute("id", "dice_roll");
        jCont.innerHTML = '<div class="dice-result-list"></div>';
        document.body.prepend(jCont);
    }

    static getImage(asset, nVal)
    {
        let folder = asset;
        if (folder === "" || folder === undefined || folder.indexOf("..") !== -1)
            return DiceContainer._fallback + "/dice-" + nVal + ".png";
        else
            return "/media/personalisation/dice/" + folder + "/dice-" + nVal + ".png";
    }

    static createResultElement(id, sName, first, second, total, asset)
    {
        let nFirst = parseInt(first);
        let nSecond = parseInt(second);
        let nTotal = parseInt(total);

        const img1 = DiceContainer.getImage(asset, nFirst);
        const img2 = DiceContainer.getImage(asset, nSecond);

        const div = document.createElement("div");
        div.setAttribute("class","dice-content blue-box pos-rel");
        div.setAttribute("id", id);
        div.innerHTML = `<p><img class="dice-icon" src="/media/assets/images/icons/icon-dices.png"> <span class="who">${sName}</span> rolled a <span class="total big">${nTotal}</span><br>
        <img class="dice-image" src="${img1}"><img class="dice-image" src="${img2}"></p>
        <div class="dice-line-countdown"></div>`;
        return div;

    }

    getDiceAsset(dice)
    {
        if (dice === undefined || dice === "")
            return "";
        else
            return dice;
    }

    appendResult(id, bIsPlayer, userId, first, second, total, dice)
    {
        const asset = this.getDiceAsset(dice);
        const sName = bIsPlayer ? "You" : this.getPlayerName(userId);
        document.getElementById("dice_roll").querySelector(".dice-result-list").prepend(DiceContainer.createResultElement(id, sName, first, second, total, asset));
        return id;
    }

    static removeResult(id)
    {
        const elem = document.getElementById(id);
        if (elem !== null)
            elem.parentNode.removeChild(elem);
    }

    show(bIsPlayer, userId, first, second, total, dice)
    {
        const nId = this.appendResult(++DiceContainer._count, bIsPlayer, userId, first, second, total, dice);
        setTimeout(() => DiceContainer.removeResult(nId), DiceContainer._timeout); 
    }

    static OnShow(e)
    {
        new DiceContainer().show(e.detail.isme, e.detail.user, e.detail.first, e.detail.second, e.detail.total, e.detail.dice);
    }

    static OnPlayers(e)
    {
        DiceContainer._jPlayerMap = e.detail.map;
    }
}

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/media/client/game/dice/dice.css");
    document.head.appendChild(styleSheet);
})();

document.body.addEventListener("meccg-dice-rolled", DiceContainer.OnShow, false);
document.body.addEventListener("meccg-players-updated", DiceContainer.OnPlayers, false);
document.body.addEventListener("meccg-init-ready", () => new DiceContainer().create(), false);

