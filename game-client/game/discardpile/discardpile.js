
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
        elem.setAttribute("class", "discardpiles hide");
        elem.setAttribute("id", this.id);
        list[0].appendChild(elem);
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
        cont.setAttribute("class", "challenger-discardpile");
        cont.setAttribute("id", contId);
        cont.setAttribute("title", name + "'s discard pile");

        let img = document.createElement("img");
        img.setAttribute("id", this.imgPrefix + playerId);
        img.setAttribute("src", "/media/assets/images/cards/backside.jpg");
        img.setAttribute("class","card-icon discardpile-card-icon");
        img.setAttribute("data-image-backside", "/media/assets/images/cards/backside.jpg");

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
    document.body.addEventListener("meccg-discardpile-hide", pInstance.hideDiscardPiles.bind(pInstance), false);
})();