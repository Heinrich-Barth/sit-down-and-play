
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

    _changeBackground(sNew)
    {
        if (GamePreferences._replaceBackground(sNew))
            this.updateCookie("background", sNew);
    }

    getCookieUpdateUrl()
    {
        return GamePreferences.URL;
    }

    _bgEagle()
    {
        this._changeBackground("bg-eagle");
    }

    _bgRivendell()
    {
        this._changeBackground("bg-rivendell");
    }

    _bgEdoras()
    {
        this._changeBackground("bg-edoras");
    }

    _bgUnderdeeps()
    {
        this._changeBackground("bg-underdeeps");
    }

    _chat(isActive)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-chat-view", { "detail": isActive }));
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
        div.innerHTML = `<a id="question-fake-hide-a" href="https://meet.jit.si/${g_sRoom}" target="_blank">Audio Chat</a>`;
        document.body.appendChild(div);
        document.getElementById("question-fake-hide-a").click();
        DomUtils.removeNode(document.getElementById("question-fake-hide"));
    }
    
    async _saveGamefunction()
    {
        try 
        {
            let directory = await window.showDirectoryPicker();
            let fileHandle = await directory.getFileHandle("savegame" + Date.now() + ".meccgsave", { create: true });
            let writable = await fileHandle.createWritable();
            try
            {
                await writable.write(JSON.stringify(g_Game.GameBuilder.getSavedGame(), null, "\t"));
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Game saved to disk." }));
            }
            finally
            {
                await writable.close();
            }

        } 
        catch(e) 
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not save file." }));
            console.log(e);
        }
    }



    static useImagesDC()
    {
        return true; /* Preferences._getConfigValue("images_errata_dc");*/
    }

    static useImagesIC()
    {
        return true; /*Preferences._getConfigValue("images_errata_ic");*/
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

        /*
        createEntry0("images_errata_dc");
        createEntry0("images_errata_ic");
        */
        this.createSection("Backgrounds");
        this.createEntry0("bg_default");
        this.createEntry0("bg_rivendell");
        this.createEntry0("bg_edoras");
        this.createEntry0("bg_deeps");

        this.createSection("Game");
        this.createEntry0("game_show_lobby");       
        this.createEntry0("game_addcards");       
        this.createEntry0("game_save");
        this.createEntry0("leave_game");

        this.createSection("Rules");
        this.createEntry0("rules_wizard");       
        this.createEntry0("rules_dragons");       
        this.createEntry0("rules_dark-minions");       
        this.createEntry0("rules_lidless-eye");
        this.createEntry0("rules_against-the-shadow");       
        this.createEntry0("rules_white-hand");       
        this.createEntry0("rules_balrog");       
    }

    addConfiguration()
    {

        this.addConfigToggle("viewpile_open", "I can see my own card piles (when reavling to opponent etc.)", true);
        /*
        Preferences.addConfigToggle("auto_reveal", "Reveal cards automatically", true);
        
        */
        this.addConfigToggle("discard_facedown", "Discard cards face down", true);
        this.addConfigToggle("images_errata_dc", "Use Dreamcards Errata", true);
        this.addConfigToggle("images_errata_ic", "Use Errata", true);

        this.addConfigAction("bg_default", "Eagle", false, "fa-picture-o", this._bgEagle.bind(this));
        this.addConfigAction("bg_rivendell", "Rivendell (Jerry VanderStelt)", false, "fa-picture-o", this._bgRivendell.bind(this));
        this.addConfigAction("bg_edoras", "Edoras (bakarov/Onur Bakar)", false, "fa-picture-o", this._bgEdoras.bind(this));
        this.addConfigAction("bg_deeps", "Bridge (Paul Mmonteagle)", false, "fa-picture-o", this._bgUnderdeeps.bind(this));

        this.addConfigToggle("show_chat", "Show chat window", true, this._chat);

        this.addConfigToggle("game_show_lobby", "Open Lobby whenever someone enters", true);
        
        this.addConfigAction("game_addcards", "Add new cards to sideboard", false, "fa-plus-square", this._addCardsToDeck);
        this.addConfigAction("game_audio", "Join audio chat", false, "fa-headphones", this._gameAudio);
        this.addConfigAction("game_save", "Save current game", false, "fa-floppy-o", this._saveGame);

        this.addConfigAction("leave_game", "End game now (after confirmation)", false, "fa-sign-out", this._endGame);

        /*
        this.addConfigAction("rules_wizards", "The Wizards", false, "fa-eye", Preferences.callbacks._showRule);
        this.addConfigAction("rules_dragons", "The Dragons", false, "fa-eye", Preferences.callbacks._showRule);
        this.addConfigAction("rules_dark-minions", "Dark Minions", false, "fa-eye", Preferences.callbacks._showRule);
        this.addConfigAction("rules_lidless-eye", "Lidless Eye", false, "fa-eye", Preferences.callbacks._showRule);
        this.addConfigAction("rules_against-the-shadow", "Against the Shadow", false, "fa-eye", Preferences.callbacks._showRule);
        this.addConfigAction("rules_white-hand", "The White Hand", false, "fa-eye", Preferences.callbacks._showRule);
        this.addConfigAction("rules_balrog", "Balrog", false, "fa-eye", Preferences.callbacks._showRule);
        */
    }


};

const g_pGamesPreferences = new GamePreferences();
g_pGamesPreferences.init();


(function() { 
    
    fetch(GamePreferences.URL).then((response) => response.json().then((data) => GamePreferences._replaceBackground(data.background)));

})();
