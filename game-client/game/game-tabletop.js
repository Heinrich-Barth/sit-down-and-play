
const g_Game = { };

g_Game.onDocumentReady = function()
{
    g_Game.CardPreview = CardPreview;
    g_Game.CardList = new CardList();
    g_Game.TaskBarCards = new TaskBarCardsInterface(g_Game.CardList, g_Game.CardPreview);
    g_Game.Scoring = createScoringApp(g_Game.CardList, g_Game.TaskBarCards);
    g_Game.HandCardsDraggable = createHandCardsDraggable(g_Game.CardPreview,MeccgApi, g_Game.Scoring);
    g_Game.CompanyManager = createCompanyManager(g_Game.CardList, g_Game.CardPreview, g_Game.HandCardsDraggable);
    g_Game.Stagingarea = createStagingArea(g_Game.CardList, g_Game.CardPreview);

    g_Game.GameBuilder = createGameBuilder(g_Game.CardList, 
        g_Game.CardPreview, 
        g_Game.HandCardsDraggable, 
        g_Game.CompanyManager, 
        g_Game.Stagingarea, 
        g_Game.Scoring,
        Preferences
        );
    
    document.body.dispatchEvent(new CustomEvent('meccg-api-init'));
};

document.body.addEventListener("meccg-init-ready", g_Game.onDocumentReady, false);

