
class Preferences {

    static _id = 0;
    static config = { };    

    constructor()
    {
        this._html = "";
    }

    static _emptyCallback()
    {

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
            checkbox: false
        }
    }

    addConfigToggle(id, title, initialValue, pCAllback)
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
        if (Preferences.config[id].checkbox)
        {
            this._html += `<div class="preference">
                <input type="checkbox" id="${_id}" name="${sInputName}" ${sCheck}>
                <label data-type="check" for="${_id}"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>
            </div>`;      
        }
        else
        {
            this._html += `<div class="preference">
                <label data-id="${sInputName}" class="pref-hover" data-type="action"><i class="fa ${sCss}" data-on="${Preferences.config[id].type_on}" data-off="${Preferences.config[id].type_off}" aria-hidden="true"></i>  ${sTitle}</label>
            </div>`;      
        }
    }

    createSection(sTitle)
    {
        this._html += `<div class="preference-section preference-section-pad">${sTitle}</div>`;
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

    static onEventChange(e)
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
    }

    addConfiguration()
    {

    }

    getGameCss()
    {
        return "";
    }

    getCookieUpdateUrl()
    {
        return "";
    }

    updateCookie(name, value)
    {
        const options = {
            method: 'POST',
            body: JSON.stringify({ name: name, value: value }),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    
        const sUrl = this.getCookieUpdateUrl();
        if (sUrl !== undefined && sUrl !== null && sUrl !== "")
            fetch(sUrl, options).then(() => {}).catch(() => console.log("error"));
    }

    init()
    {
        if (document.getElementById("config-panel") !== null)
            return;
        
        this._html = "";
        this.addConfiguration();
        this.getEntries();

        if (this._html === "")
            return;
        
        const div = document.createElement("div");
        div.setAttribute("class", "config-wrapper blue-box " + this.getGameCss());
        div.innerHTML = `<div class="icons cursor-pointer" id="prefs">
                            <i class="fa fa-sliders" aria-hidden="true" title="Preferences"></i>
                        </div>
                        <div id="preferences-wrapper" class="hide">
                            <div class="config-panel-overlay" id="config-panel-overlay"></div>
                            <div class="config-panel config-panel blue-box" id="config-panel"></div>
                        </div>`;
        document.body.appendChild(div);

        document.getElementById("config-panel").innerHTML = this._html;
        this._html = null;
        
        document.getElementById("prefs").onclick = () => setTimeout(function() { document.getElementById("preferences-wrapper").classList.remove("hide"); }, 500);
        document.getElementById("config-panel-overlay").onclick = () => document.getElementById("preferences-wrapper").classList.add("hide");

        ArrayList(document.getElementById("config-panel")).find("input").each((_el) => _el.onchange = Preferences.onEventChange);
        ArrayList(document.getElementById("config-panel")).find("label[data-type=action]").each((_el) => _el.onclick = Preferences.onEventClick);
    }
};