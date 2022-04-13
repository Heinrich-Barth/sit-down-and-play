
class GamePreferences extends Preferences {

    constructor()
    {
        super();
    }

    static URL = "/data/preferences/game";

    getGameCss()
    {
        return "config-wrapper-game";
    }

    static _replaceBackground(sNew)
    {
        if (sNew === undefined || sNew === "" || document.body.classList.contains(sNew))
            return false;

        document.body.classList.add(sNew)

        let list = document.body.classList;
        for (let _name of list)
        {
            if (_name !== sNew && _name.indexOf("bg-") === 0)
                document.body.classList.remove(_name);
        }

        return true;
    }

    getCookieUpdateUrl()
    {
        return GamePreferences.URL;
    }

    _dices()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-dice-chooser"));
    }

    _chat(isActive)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-chat-view", { "detail": isActive }));
    }

    _volumeChange(val)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-sfx-test", { "detail": parseInt(val) }));
    }

    _endGame()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-query-end-game", { }));
    }

    _addCardsToDeck()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-cards-add-ingame", { "detail": "" }));
    }

    _showRule(val)
    {
        MapWindow.showRules(val.replace("rules_", ""));
    }

    _gameAudio()
    {
        const div = document.createElement("div");
        div.setAttribute("id", "question-fake-hide");
        div.setAttribute("class", "question-fake-hide");
        div.innerHTML = `<a id="question-fake-hide-a" href="https://meet.jit.si/${g_sRoom}" rel="noopener" rel="noreferrer" target="_blank">Audio Chat</a>`;
        document.body.appendChild(div);
        document.getElementById("question-fake-hide-a").click();
        DomUtils.removeNode(document.getElementById("question-fake-hide"));
    }
    
    static useImagesDC()
    {
        return Preferences._getConfigValue("images_errata_dc"); 
    }

    static useImagesIC()
    {
        return true;
    }

    static discardOpenly()
    {
        return !Preferences._getConfigValue("discard_facedown");
    }

    static offerBlindly()
    {
        return !Preferences._getConfigValue("viewpile_open");
    }

    static  autoOpenLobby()
    {
        return Preferences._getConfigValue("game_show_lobby");
    }

    getEntries()
    {
        this.createSection("General");
        this.createEntry0("viewpile_open");
        this.createEntry0("discard_facedown");
        this.createEntry0("show_chat");

        this.createSection("Backgrounds/Customise");
        this.createEntry0("bg_default");
        this.createEntry0("game_dices");
        this.createEntry0("game_sfx");

        this.createSection("Game");
        this.createEntry0("game_save");
        this.createEntry0("game_load");
        this.createEntry0("game_show_lobby");       
        this.createEntry0("game_addcards");       
        this.createEntry0("leave_game");

        this.createSection("Images");
        this.createEntry0("images_errata_dc");
    }

    addConfiguration()
    {
        this.addConfigToggle("viewpile_open", "I can see my own card piles (when reavling to opponent etc.)", true);
        this.addConfigToggle("discard_facedown", "Discard cards face down", true);
        this.addConfigToggle("images_errata_dc", "Use CoE Errata", true);
        
        this.addConfigAction("bg_default", "Change background", false, "fa-picture-o", () => document.body.dispatchEvent(new CustomEvent("meccg-background-chooser")));
        this.addConfigAction("game_dices", "Change dices", false, "fa-cube", this._dices.bind(this));        
        this.addConfigSlider("game_sfx", "Sound effects volume", 20, "fa-volume-up", this._volumeChange.bind(this));

        this.addConfigToggle("show_chat", "Show chat window", true, this._chat);

        this.addConfigToggle("game_show_lobby", "Open Lobby whenever someone enters", true);
        
        this.addConfigAction("game_addcards", "Add new cards to sideboard", false, "fa-plus-square", this._addCardsToDeck);
        this.addConfigAction("game_audio", "Join audio chat", false, "fa-headphones", this._gameAudio);
        this.addConfigAction("game_save", "Save current game", false, "fa-floppy-o", () => document.body.dispatchEvent(new CustomEvent("meccg-game-save-request", { "detail": ""})));
        this.addConfigAction("game_load", "Restore a saved game", false, "fa-folder-open", () => document.body.dispatchEvent(new CustomEvent("meccg-game-restore-request", { "detail": ""})));

        this.addConfigAction("leave_game", "End game now (after confirmation)", false, "fa-sign-out", this._endGame);
    }

    allowSfx()
    {
        return Preferences._getConfigValue("game_sfx")
    }

}

const g_pGamesPreferences = new GamePreferences();
g_pGamesPreferences.init();


(function() { 
    
    fetch(GamePreferences.URL).then((response) => response.json().then((data) => GamePreferences._replaceBackground(data.background)));

})();
