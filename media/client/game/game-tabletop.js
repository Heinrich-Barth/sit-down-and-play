
const g_Game = { };

g_Game._isReady = false;

g_Game.onImageReceived = function(jsonCards)
{
    g_sImageCDNUrl = jQuery("#interface").attr("data-image-url");

    g_Game.CardPreview = CardPreview;
    g_Game.CardList = new CardList(jsonCards.images, jsonCards.fliped, true, false, g_sImageCDNUrl);
    g_Game.TaskBarCards = createAndInit_TaskBarCards(g_Game.CardList, MeccgApi, g_Game.CardPreview);
    g_Game.ContextMenu = createContextMenu(MeccgApi);
    g_Game.Scoring = createScoringApp(MeccgApi, g_Game.CardList, g_Game.TaskBarCards);
    g_Game.HandCardsDraggable = createHandCardsDraggable(g_Game.CardPreview,MeccgApi, g_Game.Scoring);
    g_Game.CompanyManager = createCompanyManager(g_Game.CardList, MeccgApi, g_Game.CardPreview, g_Game.HandCardsDraggable, g_Game.ContextMenu);
    g_Game.Stagingarea = createStagingArea(g_Game.CardList, g_Game.CardPreview, g_Game.ContextMenu);

    g_Game.GameBuilder = createGameBuilder(g_Game.CardList, 
        g_Game.CardPreview, 
        g_Game.HandCardsDraggable, 
        MeccgApi,
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

        jQuery.get("/data/list/images", { }, g_Game.onImageReceived).fail(function(jqXHR, textStatus, errorThrown) {
            if (textStatus == 'timeout')
              console.log('The server is not responding');
          
            if (textStatus == 'error')
              console.log(errorThrown);
          
            // Etc
          });
        g_Game._isReady = true;
    }
    else
        console.log("game is already ready");
};

jQuery(document).ready(g_Game.onDocumentReady);
