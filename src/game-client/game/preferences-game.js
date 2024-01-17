
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

    #dices()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-dice-chooser"));
    }

    #chat(isActive)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-chat-view", { "detail": isActive }));
    }

    #zoomChange(val)
    {
        const rem = [];
        let add = "";

        const num = parseInt(val);
        if (num === 2)
        {
            rem.push("zoom-1");
            add = "zoom-2";
        }
        else if (num === 1)
        {
            rem.push("zoom-2");
            add = "zoom-1";
        }
        else 
        {
            rem.push("zoom-1");
            rem.push("zoom-2");
        }

        if (add !== "")
            document.body.classList.add(add);

        for (let elem of rem)
        {
            if (document.body.classList.contains(elem))
                document.body.classList.remove(elem)
        }
    }

    #toggleStackStage(isActive)
    {
        this.#toggleClass(document.querySelector(".table"), isActive, "table-stage-stacking");
    }

    #toggleClass(elem, isActive, className)
    {
        if (elem === null || className === "")
            return;

        if (isActive && !elem.classList.contains(className))
            elem.classList.add(className);
        else if (!isActive && elem.classList.contains(className))
            elem.classList.remove(className);
    }

    #toggleAlignCompaniesLeft(isActive)
    {
        this.#toggleClass(document.querySelector(".table"), isActive, "table-companies-left");
    }

    #toggleTouchHelper(isActive)
    {
        this.#toggleClass(document.body, isActive, "force-mobile-helper");
    }

    #togglePaddingBottom(isActive)
    {
        const table = document.querySelector(".area-player");
        if (table === null)
            return;

        if (isActive && !table.classList.contains("table-padding-bottom"))
            table.classList.add("table-padding-bottom");
        else if (!isActive && table.classList.contains("table-padding-bottom"))
            table.classList.remove("table-padding-bottom");
    }

    #changeSeating()
    {
        if (typeof ChangeSeating !== "undefined")
            ChangeSeating.change();
    }

    #autosave(isActive)
    {
        if (isActive)
            document.body.setAttribute("data-autosave", "true");
        else if (document.body.hasAttribute("data-autosave"))
            document.body.removeAttribute("data-autosave");
    }

    #doubleMiscPoints(isActive)
    {
        MeccgApi.send("/game/score/doublemisc", { misc: isActive === true });
    }

    #toggleSpanishCards(isActive)
    {
        sessionStorage.setItem("cards_es", isActive ? "yes" : "no");

        const list = document.body.getElementsByClassName("card-icon");
        if (list === null || list.length === 0)
            return;

        for (let elem of list)
            this._replaceImageLanguage(elem, !isActive);
    }

    #toogleCompanyLineBreak(isActive)
    {
        if (isActive && !document.body.classList.contains("table-companies-breakline"))
            document.body.classList.add("table-companies-breakline");
        else if (!isActive && document.body.classList.contains("table-companies-breakline"))
            document.body.classList.remove("table-companies-breakline");
    }

    _replaceImageLanguage(img, useEnglish)
    {
        this.#replaceImageLanguageAttribute(img, useEnglish, "src");
        this.#replaceImageLanguageAttribute(img, useEnglish, "data-image-backside");
        this.#replaceImageLanguageAttribute(img, useEnglish, "data-img-image");
    }

    #replaceImageLanguageAttribute(img, useEnglish, attribName)
    {
        if (!img.hasAttribute(attribName))
            return;

        const val = img.getAttribute(attribName);
        if (useEnglish)
        {
            if (val.indexOf("/es-remaster/") !== -1)
                img.setAttribute(attribName, val.replace("/es-remaster/", "/en-remaster/"));
        }
        else if (val.indexOf("/en-remaster/") !== -1)
            img.setAttribute(attribName, val.replace("/en-remaster/", "/es-remaster/"));
    }

    #toggleFullscreen(isActive)
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
        else if (document.exitFullscreen) 
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)  /* Safari */
            document.webkitExitFullscreen();
    }

    #backgroundDarkness(isActive)
    {
        const elem = document.getElementById("table-dark");
        if (isActive)
        {
            if (elem !== null)
                return;

            const obj = document.createElement("div");
            obj.setAttribute("class", "table-dark");
            obj.setAttribute("id", "table-dark");
            document.body.prepend(obj);
        }
        else if (elem !== null)
        {
            elem.parentElement.removeChild(elem);
        }
    }

    #volumeChange(val)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-sfx-test", { "detail": parseInt(val) }));

        document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
            name : "System",
            message : "Set volume to " + val
        }}));
    }


    #copySharePlay()
    {
        this.#copyToClipboard(document.location.href);
    }

    #copyShareWatch()
    {
        this.#copyToClipboard(document.location.href + "/watch");
    }

    #copyToClipboard(text)
    {
        if (navigator === undefined || navigator.clipboard === undefined || typeof text !== "string" || text === "")
            return;

        navigator.clipboard.writeText(text)
        .then(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Link copied to clipboard."})))
        .catch((err) => 
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not copy link to clipboard."}));
            console.error(err);
        });
    }

    #changeAvatar()
    {
        MeccgApi.send("/game/character/list");
    }

    #endGame()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-query-end-game", { }));
    }

    #addCardsToDeck()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-cards-add-ingame", { "detail": "" }));
    }

    #gameAudio()
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
        this.createSection("Backgrounds / Customise");

        if (!bWatcher)
        {
            this.createEntry0("change_avatar");
            this.createEntry0("game_dices");
        }

        this.createEntry0("bg_default");
        this.createEntry0("bg_shawod");
        this.createEntry0("game_sfx");

        this.createSection("Look & Feel");
        this.createEntry0("toggle_zoom");
        if (!bWatcher)
        {
            this.createEntry0("toggle_company_break");
            this.#toggleStackStage(true);
            this.createEntry0("toggle_stack_stage");

            this.#toggleAlignCompaniesLeft(true);
            this.createEntry0("toggle_align_companies_left");
            this.createEntry0("use_padding_bottom");
        }
        
        this.createEntry0("toggle_fullscreen");

        this.createSection("Accessibility / Language");
        this.createEntry0("toggle_spanishcards");
        if (!bWatcher)
            this.createEntry0("toggle_touch_help");


        if (!bWatcher)
        {
            this.createSection("Save/Load");
            this.createEntry0("game_save");
            this.createEntry0("game_load");
            
            if (this.isAdmin())
                this.createEntry0("game_autosave");

            this.createSection("Game & DC Settings");
            if (this.isAdmin())
                this.createEntry0("change_seats");

            this.createEntry0("game_addcards");   
            
            if (this.isAdmin())
                this.createEntry0("score_double_misc");
                
            this.createEntry0("images_errata_dc");
    
            this.createSection("Social Media");
            this.createEntry0("share_play");
            this.createEntry0("share_watch");                    
        }

        this.createSection("General");
        if (!bWatcher)
            this.createEntry0("viewpile_open");
        
        this.createEntry0("show_chat");
        
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
        this.addConfigToggle("viewpile_open", "I can see my own card piles (reavling to opponent...)", true);
        this.addConfigToggle("images_errata_dc", "Use CoE Errata", this.getUseDCByDefault());
        
        this.addConfigAction("bg_default", "Change background", false, "fa-picture-o", () => document.body.dispatchEvent(new CustomEvent("meccg-background-chooser")));
        this.addConfigAction("game_dices", "Change dices", false, "fa-cube", this.#dices.bind(this));        
        this.addConfigSlider("game_sfx", "Sound volume", 100, 20, "fa-volume-up", this.#volumeChange.bind(this));
        this.addConfigSlider("toggle_zoom", "Zoom Level", 2, 1, "fa-search-plus slider-short", this.#zoomChange.bind(this));
        this.addConfigToggle("bg_shawod", "Reduce background brightness", true, this.#backgroundDarkness);
        this.addConfigToggle("score_double_misc", "Double MISC points (DC rules)", false, this.#doubleMiscPoints);
        this.addConfigToggle("toggle_fullscreen", "Toggle Fullscreen", false, this.#toggleFullscreen);
        this.addConfigToggle("show_chat", "Show game log window", true, this.#chat);
        this.addConfigToggle("toggle_company_break", "Expand companies over multiple lines", false, this.#toogleCompanyLineBreak.bind(this));

        this.addConfigToggle("toggle_spanishcards", "Use Spanish instead of English cards (if available).", sessionStorage.getItem("cards_es") === "yes", this.#toggleSpanishCards.bind(this));

        this.addConfigAction("game_addcards", "Add new cards to sideboard", false, "fa-plus-square", this.#addCardsToDeck);
        this.addConfigAction("game_audio", "Join audio chat", false, "fa-headphones", this.#gameAudio);

        if(this.isAdmin())
        {
            this.addConfigToggle("game_autosave", "Save game at the beginning of a player's turn", true, this.#autosave.bind(this));
            this.addConfigAction("change_seats", "Change player order", false, "fa-circle-o-notch", this.#changeSeating.bind(this));
        }

        this.addConfigAction("game_save", "Save current game", false, "fa-floppy-o", () => document.body.dispatchEvent(new CustomEvent("meccg-game-save-request", { "detail": ""})));
        this.addConfigAction("game_load", "Restore a saved game", false, "fa-folder-open", () => document.body.dispatchEvent(new CustomEvent("meccg-game-restore-request", { "detail": ""})));

        this.addConfigToggle("toggle_stack_stage", "Stack event cards vertically", true, this.#toggleStackStage.bind(this));
        this.addConfigToggle("toggle_align_companies_left", "Align companies to the left", true, this.#toggleAlignCompaniesLeft.bind(this));

        this.addConfigAction("leave_game", "End game now (after confirmation)", false, "fa-power-off", this.#endGame);
        this.addConfigToggle("use_padding_bottom", "Add additional space at the bottom for your hand", true, this.#togglePaddingBottom)

        this.addConfigAction("share_play", "Copy link to join this game to clipboard", false, "fa-share-alt", this.#copySharePlay.bind(this));
        this.addConfigAction("share_watch", "Copy link to watch this game to clipboard", false, "fa-share-alt", this.#copyShareWatch.bind(this));
        this.addConfigToggle("toggle_touch_help", "Use mobile touch support", false, this.#toggleTouchHelper.bind(this));
        this.addConfigAction("change_avatar", "Change your avatar icon", false, "fa-magic", this.#changeAvatar.bind(this));
        this.#toggleCardPreview();
        this.#backgroundDarkness(true);
    }

    #toggleCardPreview()
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

        this.#autosave(true);
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
