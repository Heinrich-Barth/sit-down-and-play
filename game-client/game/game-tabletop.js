
const g_Game = { };

g_Game._isReady = false;

g_Game.onImageReceived = function(jsonCards)
{
    g_sImageCDNUrl = document.getElementById("interface").getAttribute("data-image-url") || "";

    g_Game.CardPreview = CardPreview;
    g_Game.CardList = new CardList(jsonCards.images, jsonCards.fliped, true, false, g_sImageCDNUrl);
    g_Game.TaskBarCards = new TaskBarCardsInterface(g_Game.CardList, g_Game.CardPreview);
    g_Game.ContextMenu = new ContextMenuInterface();
    g_Game.Scoring = createScoringApp(g_Game.CardList, g_Game.TaskBarCards);
    g_Game.HandCardsDraggable = createHandCardsDraggable(g_Game.CardPreview,MeccgApi, g_Game.Scoring);
    g_Game.CompanyManager = createCompanyManager(g_Game.CardList, g_Game.CardPreview, g_Game.HandCardsDraggable, g_Game.ContextMenu);
    g_Game.Stagingarea = createStagingArea(g_Game.CardList, g_Game.CardPreview, g_Game.ContextMenu);

    g_Game.GameBuilder = createGameBuilder(g_Game.CardList, 
        g_Game.CardPreview, 
        g_Game.HandCardsDraggable, 
        g_Game.CompanyManager, 
        g_Game.Stagingarea, 
        g_Game.Scoring,
        Preferences
        );
    
    MeccgApi.onDocumentReady();
};

g_Game.onDocumentReady = function()
{
    if (!g_Game._isReady)
    {
        /* global variable from html page script block */
        if (typeof g_sImageCDNUrl === "undefined")
            g_sImageCDNUrl = "";

        fetch("/data/list/images").then((response) => 
        {
            if (response.status === 200)
            {
              response.json().then(g_Game.onImageReceived);
              g_Game._isReady = true;
            }
                
        })
        .catch((err) => 
        {
            MeccgUtils.logError(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch image list." }));
        });
    }
};

(function() {
    g_Game.onDocumentReady();
})();
