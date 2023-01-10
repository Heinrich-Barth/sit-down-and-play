
class DiscardPileAtTable 
{
    constructor()
    {
        this.id = "discardpiles_opponent";
        this.imgPrefix = "discardimage_";
    }

    insertCss()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/media/client/game/discardpile/discardpile.css");
        document.head.appendChild(styleSheet);
    }

    insertContainer()
    {
        const list = document.getElementsByClassName("staging-area-opponent");
        if (list.length === 0)
            return;

        const elem = document.createElement("div");
        elem.classList.add("discardpiles");
        elem.classList.add("fr");
        if (!DiscardPileAtTable.isWatching())
            elem.classList.add("hide");

        elem.setAttribute("id", this.id);
        list[0].appendChild(elem);
    }

    static isWatching()
    {
        return document.body.getAttribute("data-is-watcher") === "true";
    }
    
    updateDiscardContainers(e)
    {
        const playerId = e.detail.challengerId;
        const map = e.detail.map;
        const playerIds = Object.keys(map);
        for (let _player of playerIds)
        {
            if (playerId !== _player)
                this.addPlayer(_player, map[_player]);
        }
    }

    addPlayer(playerId, name)
    {
        if (playerId === undefined || name === undefined)
            return;

        const contId = "discard_" + playerId;
        if (document.getElementById(contId) !== null)
            return;

        let cont = document.createElement("div");
        cont.setAttribute("class", "challenger-discardpile pos-rel");
        cont.setAttribute("id", contId);
        cont.setAttribute("title", name + "'s discard pile");
        cont.setAttribute("data-player", playerId);

        let img = document.createElement("img");
        img.setAttribute("id", this.imgPrefix + playerId);
        img.setAttribute("src", "/data/backside");
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("class","card-icon discardpile-card-icon");
        img.setAttribute("data-image-backside", "/data/backside");

        cont.appendChild(img);
        document.getElementById(this.id).appendChild(cont);

        CardPreview.init(document.getElementById(contId), false, true);
    }

    hideDiscardPiles()
    {
        const list = document.getElementsByClassName("discardpile-card-icon");
        const len = list.length;
        for (let i = 0; i < len; i++)
            list[i].src = list[i].getAttribute("data-image-backside");
    }

    addCardToContainers(e)
    {
        const user = e.detail.owner;
        const img = g_Game.CardList.getImage(e.detail.code);
        const elem = document.getElementById(this.imgPrefix + user);
        if (elem !== null)
            elem.src = img;

        document.getElementById(this.id).classList.remove("hide");
    }
}

(function()
{
    const pInstance = new DiscardPileAtTable();
    pInstance.insertCss();
    pInstance.insertContainer();

    document.body.addEventListener("meccg-players-updated", pInstance.updateDiscardContainers.bind(pInstance), false);
    document.body.addEventListener("meccg-discardpile-add", pInstance.addCardToContainers.bind(pInstance), false);

    /** allow spectators to always see discard piles */
    if (!DiscardPileAtTable.isWatching())
        document.body.addEventListener("meccg-discardpile-hide", pInstance.hideDiscardPiles.bind(pInstance), false);
})();