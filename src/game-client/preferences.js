class PreferencesStorable {

    constructor()
    {
        this.data = this.loadData();
    }

    getLocalStorageKey()
    {
        return "meccg_data";
    }

    loadData()
    {
        try
        {
            const key = this.getLocalStorageKey();
            const val = key === "" ? null : localStorage.getItem(key);
            if (val !== null)
                return JSON.parse(val);
        }
        catch (errIgnore)
        { }

        return { };
    }

    updateCookie(key, value)
    {
        this.data[key] = value;
        const localKey = this.getLocalStorageKey();
        if (localKey !== "")
            localStorage.setItem(localKey, JSON.stringify(this.data));
    }
}

class Preferences extends PreferencesStorable {

    constructor()
    {
        super();

        this._htmlCurrentSection = null;
        this._html = [];
    }

    static _id = 0;
    static config = { };   

    static Type = {
        TOGGLE : 1,
        CHECKBOX : 2,
        SLIDER: 3
    }


    static _emptyCallback()
    {
        /** fallback */
    }

    static _getConfigValue(id, def)
    {
        return typeof Preferences.config[id] === "undefined" ? def : Preferences.config[id].value;
    }

    addConfigAction (id, title, initialValue, type, pCallback)
    {
        if (typeof pCallback === "undefined")
            pCallback = Preferences._emptyCallback;

        Preferences.config[id] = {
            title: title,
            value : initialValue,
            callback : pCallback,
            type_on: "",
            type_off: type,
            type: Preferences.Type.TOGGLE
        }
    }

    addConfigToggle(id, title, initialValue, pCallback)
    {
        if (typeof pCallback === "undefined")
            pCallback = Preferences._emptyCallback;

        Preferences.config[id] = {
            title: title,
            value : initialValue,
            callback : pCallback,
            type_on: "fa-toggle-on",
            type_off: "fa-toggle-off",
            type: Preferences.Type.CHECKBOX
        }
    }

    addConfigSlider(id, title, max, initialValue, icon, pCallback)
    {
        if (typeof pCallback === "undefined")
            pCallback = Preferences._emptyCallback;

        Preferences.config[id] = {
            title: title,
            value : Preferences.toInt(initialValue),
            callback : pCallback,
            type_on: icon,
            type_off: icon,
            max_val: max,
            type: Preferences.Type.SLIDER
        }
    }

    static toInt(value)
    {
        try
        {
            if (!isNaN(value))
                return parseInt(value);
        }
        catch (_err)
        {
            /** ignore */
        }

        return 0;
    }

    createEntry0(id)
    {
        if (typeof Preferences.config[id] === "undefined")
            return;

        let sInputName = id;
        let sTitle = Preferences.config[id].title;
        let sCheck = Preferences.config[id].value ? "checked" : "";
        let sCss = Preferences.config[id].value ? Preferences.config[id].type_on : Preferences.config[id].type_off;
        let _id = "preference_id_" + (++Preferences._id);

        const div = document.createElement("div");
        div.setAttribute("class", "preference");

        if (Preferences.config[id].type === Preferences.Type.CHECKBOX)
        {
            div.innerHTML = `
                <input type="checkbox" id="${_id}" name="${sInputName}" ${sCheck}>
                <label data-type="check" for="${_id}"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>`;      
        }
        else if (Preferences.config[id].type === Preferences.Type.SLIDER)
        {
            if (Preferences.config[id].max <= Preferences.config[id].min)
                return

            div.innerHTML = `
                <label data-type="check" for="${_id}"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>
                <input type="range" name="${sInputName}" min="0" max="${Preferences.config[id].max_val}" value="${Preferences.config[id].value}" id="${_id}">`;      
        }
        else
        {
            div.innerHTML = `<label data-id="${sInputName}" class="pref-hover" data-type="action"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>`;
        }

        if (this._htmlCurrentSection !== null)
            this._htmlCurrentSection.append(div);
    }

    createSection(sTitle)
    {
        this._htmlCurrentSection = document.createElement("div")
        this._htmlCurrentSection.setAttribute("class", "preference-section");
        this._html.push(this._htmlCurrentSection);

        const div = document.createElement("div");
        div.setAttribute("class", "preference-section-pad");
        div.innerText = sTitle;
        this._htmlCurrentSection.append(div);
    }

    getEntries()
    {
        return "";
    }

    static onEventClick(e)
    {
        const id = this.getAttribute("data-id");
        if (id !== null && typeof Preferences.config[id] !== "undefined")
            Preferences.config[id].callback(id);

        document.getElementById("preferences-wrapper").classList.add("hide");
        e.stopPropagation();
    }

    static onEventChangeCheckbox(pThis)
    {
        const value = pThis.checked;
        const bIs = pThis.checked;
        const sibling = pThis.nextElementSibling;

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

        return value;
    }

    static onEventChange(e)
    {
        const id = this.name;
        if (typeof Preferences.config[id] !== "undefined")
        {
            
            if (Preferences.config[id].type === Preferences.Type.CHECKBOX)
                Preferences.config[id].value = Preferences.onEventChangeCheckbox(this);
            else if (Preferences.config[id].type === Preferences.Type.SLIDER)
                Preferences.config[id].value = this.value;

            Preferences.config[id].callback(Preferences.config[id].value);
        }

        e.stopPropagation();
    }

    addConfiguration()
    {
        /** to overwrite */
    }

    getGameCss()
    {
        return "";
    }
    
    init()
    {
        if (document.getElementById("config-panel") !== null)
            return;
        
        this._html = [];
        this.addConfiguration();
        this.getEntries();

        if (this._html.length === 0)
            return;
        
        const div = document.createElement("div");
        div.setAttribute("class", "config-wrapper blue-box " + this.getGameCss());
        div.innerHTML = `<div class="icons cursor-pointer" id="prefs">
                            <i class="fa fa-cog" aria-hidden="true" title="Preferences"></i>
                        </div>
                        <div id="preferences-wrapper" class="hide">
                            <div class="config-panel-overlay" id="config-panel-overlay"></div>
                            <div class="config-panel blue-box" id="config-panel"></div>
                        </div>`;
        document.body.appendChild(div);

        const target = document.getElementById("config-panel");
        for (let elem of this._html)
            target.append(elem);
        
        this._html = [];
        
        document.getElementById("prefs").onclick = () => setTimeout(function() { document.getElementById("preferences-wrapper").classList.remove("hide"); }, 500);
        document.getElementById("config-panel-overlay").onclick = () => document.getElementById("preferences-wrapper").classList.add("hide");

        ArrayList(document.getElementById("config-panel")).find("input").each((_el) => _el.onchange = Preferences.onEventChange);
        ArrayList(document.getElementById("config-panel")).find("label[data-type=action]").each((_el) => _el.onclick = Preferences.onEventClick);
    }
}
