

class Notification {

    static count = 0;

    static _timeout = 5000;

    insertCss()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("href", "/client/notification/notification.css?version=" + Date.now());
        document.head.appendChild(styleSheet)
    }

    init()
    {
        if (document.getElementById("notifications") === null)
        {
            this.insertCss();

            const div = document.createElement("div");
            div.setAttribute("id", "notifications");
            div.setAttribute("class", "notifications");
            document.body.appendChild(div);
        }
    }

    static error(content)
    {
        new Notification().msg(content, "failure", "fa-exclamation-triangle");
    }

    static OnError(e)
    {
        Notification.error(e.detail);
    }

    static success(content)
    {
        new Notification().msg(content, "success", "fa-check-square-o");
    }

    static OnSuccess(e)
    {
        Notification.success(e.detail);
    }
    
    static info(content)
    {
        new Notification().msg(content, "info", "fa-bell");
    }

    static OnInfo(e)
    {
        Notification.info(e.detail);
    }

    _requestId()
    {
        if (Notification.count === 100)
        {
            Notification.count = 0;
            return 0;
        }
        else
            return ++Notification.count;
    }

    #getOldMessages()
    {
        const list = [];
        const elem = document.getElementById("notifications");
        for (let note of elem.querySelectorAll(".notification"))
        {
            if (this.#isExpired(note))
                list.push(note);   
        }

        return list;
    }



    #removeOldMessages()
    {
        const elem = document.getElementById("notifications");
        for (let _e of this.#getOldMessages())
            elem.removeChild(_e);
    }

    #isExpired(elem)
    {
        try
        {
            const time = parseInt(elem.getAttribute("data-time"));
            return Date.now() - time > 4000;
        }
        catch (e)
        {
            /** ignore */
        }

        return false;
    }

    addMessage(content, sClass, sIcon)
    {
        const id = "notify_" + this._requestId();  

        const wrapper = document.createElement("div");
        wrapper.setAttribute("class", "notification " + sClass);
        wrapper.setAttribute("data-time", "" + Date.now());
        wrapper.setAttribute("id", id);

        const icon = document.createElement("div");
        icon.setAttribute("class", "notification-element notification-icon fa " + sIcon);
        icon.setAttribute("aria-hidden", "true");

        const text = document.createElement("div");
        text.setAttribute("class", "notification-element notification-text");

        const p = document.createElement("span");
        p.innerText = content;

        const line = document.createElement("div");
        line.setAttribute("class", "notification-line-countdown");

        text.append(p, line);

        wrapper.append(icon, text);

        document.getElementById("notifications").appendChild(wrapper);
    }

    addTimeout(id)
    {
        setTimeout(() => Notification.removeMessage(id), Notification._timeout);
    }

    msg(content, sClass, sIcon)
    {
        this.addMessage(content, sClass, sIcon)
        this.#removeOldMessages();
    }

    static removeMessage(id)
    {
        const elem = document.getElementById(id);
        if (elem === null)
            return;

        while (elem.firstChild) 
            elem.removeChild(elem.firstChild);

        elem.parentNode.removeChild(elem);
    }
}

document.body.addEventListener("meccg-notify-success", Notification.OnSuccess, false);
document.body.addEventListener("meccg-notify-info", Notification.OnInfo, false);
document.body.addEventListener("meccg-notify-error", Notification.OnError, false);

(function() {
    new Notification().init();
})();