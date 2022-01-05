

class Notify {

    static count = 0;

    static _timeout = 3000;

    init()
    {
        if (document.getElementById("notifications") === null)
        {
            const div = document.createElement("div");
            div.setAttribute("id", "notifications");
            document.body.appendChild(div);
        }
    }

    static error(content)
    {
        new Notify().msg(content, "failure", "fa-exclamation-triangle");
    }

    static OnError(e)
    {
        Notify.error(e.detail);
    }

    static success(content)
    {
        new Notify().msg(content, "success", "fa-check-square-o");
    }

    static OnSuccess(e)
    {
        Notify.success(e.detail);
    }
    
    static info(content)
    {
        new Notify().msg(content, "info", "fa-bell");
    }

    static OnInfo(e)
    {
        Notify.info(e.detail);
    }

    _requestId()
    {
        if (Notify.count === 100)
        {
            Notify.count = 0;
            return 0;
        }
        else
            return ++Notify.count;
    }

    addMessage(content, sClass, sIcon)
    {
        var id = "notify_" + this._requestId();  
        const div = document.createElement("div");
        div.classList.add(sClass);
        div.classList.add("notify");
        div.setAttribute("id", id);
        div.innerHTML = `<div class="notification-text"><i class="fa ${sIcon}" aria-hidden="true"></i>${content}</div>
            <div class="notification-line-countdown"></div>`

        document.getElementById("notifications").appendChild(div);
        return id;
    }

    addTimeout(id)
    {
        setTimeout(() => Notify.removeMessage(id), Notify._timeout);
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

document.body.addEventListener("meccg-notify-success", Notify.OnSuccess, false);
document.body.addEventListener("meccg-notify-info", Notify.OnInfo, false);
document.body.addEventListener("meccg-notify-error", Notify.OnError, false);

(function() {
    new Notify().init();
})();