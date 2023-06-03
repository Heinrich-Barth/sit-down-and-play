

class DiceContainer {
    
    static _jPlayerMap = {};
    static _count = 1;
    static _timeout = 5500;
    static _folder = "black";
    static _fallback = "/client/game/dice"

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
        const nFirst = parseInt(first);
        const nSecond = parseInt(second);

        const htmlP = document.createElement("p");
        const imgDice = document.createElement("img");
        imgDice.setAttribute("class", "dice-icon");
        imgDice.setAttribute("src", "/media/assets/images/icons/icon-dices.png");
        htmlP.appendChild(imgDice);

        const spanWho = document.createElement("span");
        spanWho.setAttribute("class", "who");
        spanWho.innerText = sName;
        htmlP.appendChild(spanWho);

        htmlP.appendChild(document.createTextNode(" rolled a "));
        
        const spanTotal = document.createElement("span");
        spanTotal.setAttribute("class", "total big");
        spanTotal.innerText = nFirst + nSecond
        htmlP.appendChild(spanTotal);
        
        htmlP.appendChild(document.createElement("br"));

        const htmlImage1 = document.createElement("img");
        htmlImage1.setAttribute("class", "dice-image");
        htmlImage1.setAttribute("src", DiceContainer.getImage(asset, nFirst));
        htmlP.appendChild(htmlImage1);

        const htmlImage2 = document.createElement("img");
        htmlImage2.setAttribute("class", "dice-image");
        htmlImage2.setAttribute("src", DiceContainer.getImage(asset, nSecond));
        htmlP.appendChild(htmlImage2);

        const divLine = document.createElement("div");
        divLine.setAttribute("class", "dice-line-countdown");

        const div = document.createElement("div");
        div.setAttribute("class","dice-content blue-box pos-rel");
        div.setAttribute("id", id);
        div.appendChild(htmlP);
        div.appendChild(divLine);

        return div;
    }

    getDiceAsset(dice)
    {
        if (dice === undefined || dice === "")
            return "";
        else
            return dice;
    }

    appendResult(id, name, first, second, total, dice)
    {
        const asset = this.getDiceAsset(dice);
        return DiceContainer.createResultElement(id, name, first, second, total, asset);
    }

    static removeResult(id)
    {
        const elem = document.getElementById(id);
        if (elem !== null)
            elem.parentNode.removeChild(elem);
    }
    
    requirePlayerName(bIsPlayer, userId, code)
    {
        if (code !== "")
            return code;
        else
            return bIsPlayer ? "You" : this.getPlayerName(userId);
    }

    show(name, first, second, total, dice, uuid)
    {
        const pos = this.getPosition(uuid);
        const nId = ++DiceContainer._count;

        const elem = this.appendResult(nId, name, first, second, total, dice);
        if (pos === null)
        {
            elem.onclick = () => DiceContainer.removeResult(nId);
            document.getElementById("dice_roll").querySelector(".dice-result-list").prepend(elem);
        }
        else
        {
            elem.removeAttribute("id");
            const div = document.createElement("div");
            div.setAttribute("class", "character-dice-body");
            div.setAttribute("id", nId);
            div.setAttribute("title", "Click to close dice result");
            div.style.left = pos.x + "px";
            div.style.top = pos.y + "px";
            div.appendChild(elem);
            div.onclick = () => DiceContainer.removeResult(nId);
            document.body.appendChild(div);
        }
        
        setTimeout(() => DiceContainer.removeResult(nId), DiceContainer._timeout); 
    }

    getPosition(uuid)
    {
        const elem = document.getElementById("ingamecard_" + uuid);
        if (elem === null)
            return null;
        
        const pos = elem.getBoundingClientRect();
        return {
            x: pos.left,
            y: pos.top
        };
    }

    static OnShow(e)
    {
        const detail = e.detail;
        const instance = new DiceContainer();

        const name = instance.requirePlayerName(detail.isme, detail.user, detail.code);
        instance.show(name, detail.first, detail.second, detail.total, detail.dice, detail.uuid);
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
    styleSheet.setAttribute("href", "/client/game/dice/dice.css?t=" + Date.now());
    document.head.appendChild(styleSheet);
})();

document.body.addEventListener("meccg-dice-rolled", DiceContainer.OnShow, false);
document.body.addEventListener("meccg-players-updated", DiceContainer.OnPlayers, false);
document.body.addEventListener("meccg-init-ready", () => new DiceContainer().create(), false);

