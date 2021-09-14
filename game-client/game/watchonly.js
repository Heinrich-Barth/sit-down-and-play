
const WatchOnly = {

    init : function()
    {
        if (document.body.getAttribute("data-is-watcher") !== "true")
            return;

        document.body.classList.add("game-watch-only");
    }
};


document.body.addEventListener("meccg-api-init", WatchOnly.init, false);
