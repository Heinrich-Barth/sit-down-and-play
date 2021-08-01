
const Preferences = {

    _id : 0,
    _html : "",

    config : 
    {
    },

    callbacks : {

        _chat : function(isActive)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-chat-view", { "detail": isActive }));
        },

        _endGame : function()
        {
            document.body.dispatchEvent(new CustomEvent("meccg-query-end-game", { }));
        },

        _gameAudio : function()
        {
            const div = document.createElement("div");
            div.setAttribute("id", "question-fake-hide");
            div.setAttribute("class", "question-fake-hide");
            div.innerHTML = `<a id="question-fake-hide-a" href="https://meet.jit.si/${g_sRoom}" target="_blank">Audio Chat</a>`;
            document.body.appendChild(div);
            document.getElementById("question-fake-hide-a").click();
            DomUtils.removeNode(document.getElementById("question-fake-hide"));
        },

        _addCardsToDeck : function()
        {
            document.body.dispatchEvent(new CustomEvent("meccg-cards-add-ingame", { "detail": "" }));
        },

        _showRule : function(val)
        {
            MapWindow.showRules(val.replace("rules_", ""));
        }
    },

    _emptyCallback : function()
    {

    },

    _getConfigValue : function(id, def)
    {
        return typeof Preferences.config[id] === "undefined" ? def : Preferences.config[id].value;
    },

    useImagesDC : function()
    {
        return Preferences._getConfigValue("images_errata_dc");
    },

    useImagesIC : function()
    {
        return Preferences._getConfigValue("images_errata_ic");
    },

    discardOpenly : function()
    {
        return Preferences._getConfigValue("discard_facedown");
    },

    offerBlindly : function()
    {
        return !Preferences._getConfigValue("viewpile_open");
    },

    autoOpenLobby : function()
    {
        return Preferences._getConfigValue("game_show_lobby");
    },

    addConfigAction  : function(id, title, initialValue, type, pCAllback)
    {
        if (typeof pCAllback === "undefined")
            pCAllback = Preferences._emptyCallback;

        Preferences.config[id] = {
            title: title,
            value : initialValue,
            callback : pCAllback,
            type_on: "",
            type_off: type,
            checkbox: false
        }
    },

    addConfigToggle : function(id, title, initialValue, pCAllback)
    {
        if (typeof pCAllback === "undefined")
            pCAllback = Preferences._emptyCallback;

        Preferences.config[id] = {
            title: title,
            value : initialValue,
            callback : pCAllback,
            type_on: "fa-toggle-on",
            type_off: "fa-toggle-off",
            checkbox: true
        }
    },

    getEntries : function()
    {
        function createEntry0(id)
        {
            if (typeof Preferences.config[id] === "undefined")
                return;

            let sInputName = id;
            let sTitle = Preferences.config[id].title;
            let sCheck = Preferences.config[id].value ? "checked" : "";
            let sCss = Preferences.config[id].value ? Preferences.config[id].type_on : Preferences.config[id].type_off;
            //

            let _id = "preference_id_" + (++Preferences._id);
            if (Preferences.config[id].checkbox)
            {
                Preferences._html += `<div class="preference">
                    <input type="checkbox" id="${_id}" name="${sInputName}" ${sCheck}>
                    <label data-type="check" for="${_id}"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>
                </div>`;      
            }
            else
            {
                Preferences._html += `<div class="preference">
                    <label data-id="${sInputName}" class="pref-hover" data-type="action"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>
                </div>`;      
            }

        }

        function createSection(sTitle)
        {
            Preferences._html += `<div class="preference-section preference-section-pad">${sTitle}</div>`;
        }

        Preferences._html = "";

        createSection("Cards");
        createEntry0("viewpile_open");
        createEntry0("images_errata_dc");
        createEntry0("images_errata_ic");

        createSection("Chat");
        createEntry0("show_chat");

        createSection("Game");
        createEntry0("game_show_lobby");       
        createEntry0("game_addcards");       
        createEntry0("game_audio");       
        createEntry0("leave_game");

        createSection("Rules");
        createEntry0("rules_wizard");       
        createEntry0("rules_dragons");       
        createEntry0("rules_dark-minions");       
        createEntry0("rules_lidless-eye");
        createEntry0("rules_against-the-shadow");       
        createEntry0("rules_white-hand");       
        createEntry0("rules_balrog");       

        return Preferences._html;
    },

    onEventClick : function(e)
    {
        let id = this.getAttribute("data-id");
        if (id !== null && typeof Preferences.config[id] !== "undefined")
            Preferences.config[id].callback(id);

        document.getElementById("preferences-wrapper").classList.add("hide");
        e.stopPropagation();
    },

    onEventChange : function(e)
    {
        let id = this.name;
        let value = this.checked;
        let bIs = this.checked;

        const sibling = this.nextElementSibling;
        let pLabel = sibling.querySelector("i");
        let sOn = pLabel.getAttribute("data-on");
        let sOff = pLabel.getAttribute("data-off");

        if (sOn !== "" && sOff !== "")
        {
            if (bIs)
            {
                pLabel.classList.add(sOn);
                pLabel.classList.remove(sOff);
            }
            else 
            {
                pLabel.classList.add(sOff);
                pLabel.classList.remove(sOn);
            }
        }


        if (typeof Preferences.config[id] !== "undefined")
        {
            Preferences.config[id].value = value;
            Preferences.config[id].callback(value);
        }

        e.stopPropagation();
    },

    init : function()
    {
        if (document.getElementById("config-panel") !== null)
            return;

        Preferences.addConfigToggle("viewpile_open", "I can see my own card piles (when reavling to opponent etc.)", true);
        /*
        Preferences.addConfigToggle("auto_reveal", "Reveal cards automatically", true);
        Preferences.addConfigToggle("discard_facedown", "Discard cards face down", true);
        */
        Preferences.addConfigToggle("images_errata_dc", "Use Dreamcards Errata", true);
        Preferences.addConfigToggle("images_errata_ic", "Use Errata", true);

        // Preferences.addConfigValue("sound_chat_message", "Play sound for new chat message", false);
        //Preferences.addConfigValue("sound_phases", "Play sound for each phase", false);

        Preferences.addConfigToggle("show_chat", "Show chat window", true, Preferences.callbacks._chat);

        Preferences.addConfigToggle("game_show_lobby", "Open Lobby whenever someone enters", true);
        
        Preferences.addConfigAction("game_addcards", "Add new cards to sideboard", false, "fa-plus-square", Preferences.callbacks._addCardsToDeck);
        Preferences.addConfigAction("game_audio", "Join audio chat", false, "fa-headphones", Preferences.callbacks._gameAudio);
        Preferences.addConfigAction("leave_game", "End game now (after confirmation)", false, "fa-sign-out", Preferences.callbacks._endGame);

        Preferences.addConfigAction("rules_wizards", "The Wizards", false, "fa-eye", Preferences.callbacks._showRule);
        Preferences.addConfigAction("rules_dragons", "The Dragons", false, "fa-eye", Preferences.callbacks._showRule);
        Preferences.addConfigAction("rules_dark-minions", "Dark Minions", false, "fa-eye", Preferences.callbacks._showRule);
        Preferences.addConfigAction("rules_lidless-eye", "Lidless Eye", false, "fa-eye", Preferences.callbacks._showRule);
        Preferences.addConfigAction("rules_against-the-shadow", "Against the Shadow", false, "fa-eye", Preferences.callbacks._showRule);
        Preferences.addConfigAction("rules_white-hand", "The White Hand", false, "fa-eye", Preferences.callbacks._showRule);
        Preferences.addConfigAction("rules_balrog", "Balrog", false, "fa-eye", Preferences.callbacks._showRule);

        const div = document.createElement("div");
        div.setAttribute("class", "config-wrapper blue-box");
        div.innerHTML = `<div class="icons" id="prefs">
                            <div class="icon conf cursor-pointer" title="Preferences"></div>
                        </div>
                        <div id="preferences-wrapper" class="hide">
                            <div class="config-panel-overlay" id="config-panel-overlay"></div>
                            <div class="config-panel config-panel blue-box" id="config-panel"></div>
                        </div>`;
        document.body.appendChild(div);

        document.getElementById("config-panel").innerHTML = Preferences.getEntries();

        document.getElementById("prefs").querySelector(".conf").onclick = () => setTimeout(function() { document.getElementById("preferences-wrapper").classList.remove("hide"); }, 500);
        document.getElementById("config-panel-overlay").onclick = () => document.getElementById("preferences-wrapper").classList.add("hide");

        ArrayList(document.getElementById("config-panel")).find("input").each((_el) => _el.onchange = Preferences.onEventChange);
        ArrayList(document.getElementById("config-panel")).find("label[data-type=action]").each((_el) => _el.onclick = Preferences.onEventClick);

        Preferences._html = null;
    }
};

(function() { Preferences.init(); })();
