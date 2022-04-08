

class Notification {

    static count = 0;

    static _timeout = 3000;

    insertCss()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("href", "/media/client/notification/notification.css");
        document.head.appendChild(styleSheet)
    }

    init()
    {
        if (document.getElementById("notifications") === null)
        {
            this.insertCss();

            const div = document.createElement("div");
            div.setAttribute("id", "notifications");
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

    addMessage(content, sClass, sIcon)
    {
        const id = "notify_" + this._requestId();  
        const div = document.createElement("div");
        div.classList.add(sClass);
        div.classList.add("notify");
        div.setAttribute("id", id);
        div.innerHTML = `<div class="notification-text"><i class="fa ${sIcon}" aria-hidden="true"></i><span>${content}</span></div>
            <div class="notification-line-countdown"></div>`

        document.getElementById("notifications").appendChild(div);
        return id;
    }

    addTimeout(id)
    {
        setTimeout(() => Notification.removeMessage(id), Notification._timeout);
    }

    msg(content, sClass, sIcon)
    {
        this.addTimeout(this.addMessage(content, sClass, sIcon));
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