
class GamePreferences extends Preferences {

    getGameCss()
    {
        return "config-wrapper-game";
    }

    setBackgroundImage(sNew)
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

    isAdmin()
    {
        return g_sLobbyToken !== "";
    }

    _dices()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-dice-chooser"));
    }

    _chat(isActive)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-chat-view", { "detail": isActive }));
    }

    _toggleCardZoom(isActive)
    {
        if (isActive)
        {
            if (!document.body.classList.contains("zoom-1"))
                document.body.classList.add("zoom-1");

        }
        else if (document.body.classList.contains("zoom-1"))
            document.body.classList.remove("zoom-1");
    }

    _togglePaddingBottom(isActive)
    {
        const table = document.querySelector(".area-player");
        if (table === null)
            return;

        if (isActive && !table.classList.contains("table-padding-bottom"))
            table.classList.add("table-padding-bottom");
        else if (!isActive && table.classList.contains("table-padding-bottom"))
            table.classList.remove("table-padding-bottom");
    }

    _autosave(isActive)
    {
        if (isActive)
            document.body.setAttribute("data-autosave", "true");
        else if (document.body.hasAttribute("data-autosave"))
            document.body.removeAttribute("data-autosave");
    }

    _toggleFullscreen(isActive)
    {
        const elem = document.documentElement;
        if (elem === undefined)
            return;

        if (isActive)
        {
            if (elem.requestFullscreen) 
                elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) /* Safari */
                elem.webkitRequestFullscreen();
        }
        else
        {
            if (document.exitFullscreen) 
                document.exitFullscreen();
            else if (document.webkitExitFullscreen)  /* Safari */
                document.webkitExitFullscreen();
        }
    }

    _backgroundDarkness(isActive)
    {
        const list = document.getElementsByClassName("table");
        if (list ===  null || list.length < 1)
            return;

        const elem = list[0];
        if (isActive)
        {
            if (!elem.classList.contains("table-dark"))
                elem.classList.add("table-dark");
        }
        else if (elem.classList.contains("table-dark"))
            elem.classList.remove("table-dark");
    }

    _volumeChange(val)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-sfx-test", { "detail": parseInt(val) }));

        document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
            name : "System",
            message : "Set volume to " + val
        }}));
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

    static offerBlindly()
    {
        return !Preferences._getConfigValue("viewpile_open");
    }

    getEntries()
    {
        const bWatcher = GamePreferences.isWatching();
        this.createSection("Backgrounds/Customise");
        this.createEntry0("bg_default");
        this.createEntry0("bg_shawod");
        this.createEntry0("toggle_zoom");

        if (!bWatcher)
            this.createEntry0("game_dices");

        this.createEntry0("game_sfx");

        if (bWatcher)
            return;

        this.createSection("Game");
        this.createEntry0("game_addcards");   
        if (this.isAdmin())
            this.createEntry0("game_autosave");
        this.createEntry0("game_save");
        this.createEntry0("game_load");
        this.createEntry0("leave_game");

        this.createSection("Images");
        this.createEntry0("images_errata_dc");

        this.createSection("General");
        this.createEntry0("viewpile_open");
        this.createEntry0("show_chat");
        this.createEntry0("use_padding_bottom");
        this.createEntry0("toggle_fullscreen");
    }

    static isWatching()
    {
        return document.body.getAttribute("data-is-watcher") === "true";
    }

    getUseDCByDefault()
    {
        return !document.body.hasAttribute("data-use-dce") || document.body.getAttribute("data-use-dce") !== "false";
    }

    addConfiguration()
    {
        
        this.addConfigToggle("viewpile_open", "I can see my own card piles (when reavling to opponent etc.)", true);
        this.addConfigToggle("images_errata_dc", "Use CoE Errata", this.getUseDCByDefault());
        
        this.addConfigAction("bg_default", "Change background", false, "fa-picture-o", () => document.body.dispatchEvent(new CustomEvent("meccg-background-chooser")));
        this.addConfigAction("game_dices", "Change dices", false, "fa-cube", this._dices.bind(this));        
        this.addConfigSlider("game_sfx", "Sound volume", 20, "fa-volume-up", this._volumeChange.bind(this));
        this.addConfigToggle("bg_shawod", "Reduce background brightness", true, this._backgroundDarkness);
        this.addConfigToggle("toggle_fullscreen", "Toggle Fullscreen", false, this._toggleFullscreen);
        this.addConfigToggle("show_chat", "Show chat window", true, this._chat);

        this.addConfigAction("game_addcards", "Add new cards to sideboard", false, "fa-plus-square", this._addCardsToDeck);
        this.addConfigAction("game_audio", "Join audio chat", false, "fa-headphones", this._gameAudio);
        this.addConfigToggle("game_autosave", "Save game at first player's turn", true, this._autosave);
        this.addConfigAction("game_save", "Save current game", false, "fa-floppy-o", () => document.body.dispatchEvent(new CustomEvent("meccg-game-save-request", { "detail": ""})));
        this.addConfigAction("game_load", "Restore a saved game", false, "fa-folder-open", () => document.body.dispatchEvent(new CustomEvent("meccg-game-restore-request", { "detail": ""})));

        this.addConfigAction("leave_game", "End game now (after confirmation)", false, "fa-sign-out", this._endGame);
        this.addConfigToggle("use_padding_bottom", "Add additional space at the bottom for your hand", false, this._togglePaddingBottom)
        this.addConfigToggle("toggle_zoom", "Large cards on the table", false, this._toggleCardZoom);
        this._toggleCardPreview();
    }

    _toggleCardPreview()
    {
        document.body.classList.add("large-preview");
    }

    allowSfx()
    {
        return Preferences._getConfigValue("game_sfx") > 5;
    }

    init()
    {
        super.init();

        const div = document.createElement("div");
        div.setAttribute("class", "config-zoom blue-box " + this.getGameCss());

        const icons = document.createElement("div");
        icons.setAttribute("class", "icons cursor-pointer");
        icons.setAttribute("data-level", "0");
        icons.setAttribute("id", "zoom-level");
        icons.setAttribute("title", "Toggle zoom level")
        icons.innerHTML = '<i class="fa fa-search-plus" aria-hidden="true" title="Toogle zoom"></i>';

        icons.onclick = this.toggleZoom.bind(this);
        div.appendChild(icons);
        document.body.appendChild(div);

        if (this.data.background !== undefined)
            this.setBackgroundImage(this.data.background);

        this._autosave(true);
    }

    initDices()
    {
        if (typeof this.data.dices === "string")
            MeccgApi.send("/game/dices/set", { type: this.data.dices });
    }

    toggleZoom()
    {
        const elem = document.getElementById("zoom-level");
        if (elem === null)
            return;

        const level = parseInt(elem.getAttribute("data-level"));
        let cssOld = level < 1 ? "" : "zoom-" + level;
        let cssNew = level === 2 ? "" : "zoom-" + (level+1);

        if (cssNew !== "")
            document.body.classList.add(cssNew);

        if (cssOld !== "")
            document.body.classList.remove(cssOld);

        const newZoom = level < 2 ? level + 1 : 0;
        elem.setAttribute("data-level", newZoom);
    }
}

const g_pGamesPreferences = new GamePreferences();
g_pGamesPreferences.init();

document.body.addEventListener("meccg-api-ready", g_pGamesPreferences.initDices.bind(g_pGamesPreferences), false);
