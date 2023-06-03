class PreferenceChoise extends PreferencesStorable
{
    insertOption(elem)
    {
        throw new Error("please overwrite");
    }

    getHeadline()
    {
        return "";
    }

    getDescription()
    {
        return "";
    }

    showOptions(list)
    {
        if (list.length === 0)
            return;

        const container = this.createContainer();
        for (let folder of list)
            this.addOptions(folder, container);
    }  

    addOptions(folder, container)
    {
        if (folder === "" || folder.indexOf(".") !== -1)
            return;

        let elem = this.insertOption(folder);
        if (elem !== null)
            container.appendChild(elem);
    }

    static remove()
    {
        DomUtils.removeNode(document.getElementById("dices-panel"));
    }

    onClickPerformed(elem)
    {
        /** overwirte */
    }

    onDiceClick(e)
    {
        try{
            const elem = e.getAttribute("data-type");
            if (elem !== "")
                this.onClickPerformed(elem);
        }
        finally{
            DomUtils.removeNode(document.getElementById("dices-panel"));
        }
    }


    createContainer()
    {
        let contianer = document.getElementById("dices-panel-content");
        if (contianer !== null)
            return contianer;
        
        const div = document.createElement("div");
        div.setAttribute("id", "dices-panel");
        div.setAttribute("class", "dices-panel");

        div.innerHTML = `<div class="config-panel-overlay" id="dices-panel-overlay"></div>
                         <div class="config-panel blue-box" id="dices-panel-content">
                             <div class="preference-section preference-section-pad">${this.getHeadline()}</div>
                             <p>${this.getDescription()}</p>
                         </div>`;

        document.body.appendChild(div);
        
        document.getElementById("dices-panel-overlay").onclick = PreferenceChoise.remove;
        return document.getElementById("dices-panel-content");
    }

    init(sUrl)
    {
        if (sUrl !== "")
        {
            const pThis = this;
            fetch(sUrl).then((response) => response.json().then((folders) => pThis.showOptions(folders)))
            .catch((e) => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch dices." })));
        }
    }

}