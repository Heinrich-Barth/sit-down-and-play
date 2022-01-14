
const WatchOnly = {

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
    }
};

document.body.addEventListener("meccg-api-init", WatchOnly.init, false);
