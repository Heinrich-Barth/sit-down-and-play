
const WatchOnly = {

    getIconContainer : function()
    {
        return document.querySelector(".card-bar-shared .icons");
    },

    showVictory : function()
    {
        MeccgApi.send("/game/watch/victory", "victory");
        return false;
    },

    showHands : function()
    {
        MeccgApi.send("/game/watch/hand", {});
        return false;
    },

    injectIcons : function()
    {
        const container = this.getIconContainer();
        if (container === null)
            return;

        let elemScore = document.createElement("a");
        elemScore.onclick = this.showVictory;
        elemScore.setAttribute("class", "icon victory");
        elemScore.setAttribute("title", "Open score sheet");
        container.appendChild(elemScore);

        elemScore = document.createElement("a");
        elemScore.onclick = this.showHands;
        elemScore.setAttribute("id", "watch_togglehand");
        elemScore.setAttribute("class", "icon hand");
        elemScore.setAttribute("title", "Show/Hide hand cards");
        container.appendChild(elemScore);
    },

    init : function()
    {
        if (document.body.getAttribute("data-is-watcher") !== "true")
            return;

        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/media/client/game/watch/watch.css");
        document.head.appendChild(styleSheet);

        document.body.classList.add("game-watch-only");

        WatchOnly.injectIcons();
    }
};

document.body.addEventListener("meccg-api-init", WatchOnly.init, false);
