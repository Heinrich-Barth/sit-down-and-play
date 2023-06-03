class PlayerSelectorAction {

    showError(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": message }));
    }
    showWarning(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": message }));
    }
    showSuccess(message)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": message }));
    }

    labelErrorTooFewPlayers()
    {
        return "Another player is needed to show cards to";
    }

    labelChooseTradingPartner()
    {
        return "Choose player to show cards";
    }

    labelChoosePlayerToTradeWith()
    {
        return "Please choose one player to show cards";
    }

    onChoosePlayer()
    {
        const pPlayersCurrent = MeccgPlayers.getPlayers();
        const sizeCurrent = Object.keys(pPlayersCurrent).length;
        if (sizeCurrent < 2)
        {
            this.showError(this.labelErrorTooFewPlayers());
            return;
        }

        const div = document.createElement("div");
        div.setAttribute("id", "restore-game");
        div.setAttribute("class", "restore-game trade-panel config-panel");

        let _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel-overlay");
        _temp.setAttribute("title", "click here to cancel");
        _temp.setAttribute("id", "trade-panel-overlay");
        _temp.onclick = this.removeOverlay.bind(this);
        div.appendChild(_temp);

        _temp = document.createElement("div");
        _temp.setAttribute("class", "config-panel blue-box restore-panel");
        _temp.setAttribute("id", "trade-panel");
        div.appendChild(_temp);

        let _element = document.createElement("h2");
        _element.innerText = this.labelChooseTradingPartner();
        _temp.appendChild(_element);

        _element = document.createElement("p");
        _element.innerText = this.labelChoosePlayerToTradeWith();
        _temp.appendChild(_element);

        let ul = document.createElement("ul");
        _temp.appendChild(ul);

        _element = document.createElement("button");
        _element.innerText = "Cancal";
        _element.onclick = this.removeOverlay.bind(this);
        _temp.appendChild(_element);

        let _otherPlayerId = "";

        for (let key of Object.keys(pPlayersCurrent))
        {
            if (MeccgPlayers.isChallenger(key))
                continue;

            _otherPlayerId = key;

            const _li = document.createElement("li");
            const _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("data-player", key);
            _a.innerText = pPlayersCurrent[key];
            _a.onclick = this.onTriggerTrading.bind(this);
            _li.appendChild(_a);
            ul.appendChild(_li);
        }

        if (sizeCurrent === 2 && _otherPlayerId !== "")        
            this.onTriggerTrading(null, _otherPlayerId);
        else
            document.body.appendChild(div);
    }

    removeOverlay()
    {
        DomUtils.removeNode(document.getElementById("restore-game"));
    }

    onTriggerTrading(e, other)
    {
        console.error("please implemenet");
    }

    getMyId()
    {
        return MeccgPlayers.getChallengerId();
    }

}