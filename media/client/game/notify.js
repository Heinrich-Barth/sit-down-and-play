

const Notify = {

    count: 0,

    init: function ()
    {
        jQuery("body").append('<div id="notifications"></div>');
    },

    error: function (content)
    {
        this.msg(content, "failure", 3000, "fa-exclamation-triangle");
    },

    onError : function(e)
    {
        Notify.error(e.detail);
    },

    success: function (content)
    {
        this.msg(content, "success", 2000, "fa-check-square-o");
    },

    onSuccess : function(e)
    {
        Notify.success(e.detail);
    },
    
    info: function (content)
    {
        this.msg(content, "info", 2000, "fa-bell");
    },

    onInfo: function (e)
    {
        Notify.info(e.detail);
    },

    msg: function (content, sClass, _time, sIcon)
    {
        var id = "notify_" + this.count;
        this.count++;
        if (this.count === 10)
            this.count = 0;

        jQuery("#notifications").append(`<div class="${sClass} notify" id="${id}">
            <div class="notification-text"><i class="fa ${sIcon}" aria-hidden="true"></i>${content}</div>
            <div class="notification-line-countdown"></div>
        </div>`);

        setTimeout(function ()
        {
            jQuery("#notifications #" + id).remove();
        }, _time);
    },
    
    chatMessage : function(sMessage)
    {
        addMessageToChatbox("Application", sMessage);
    }

};


document.body.addEventListener("meccg-notify-success", Notify.onSuccess, false);
document.body.addEventListener("meccg-notify-info", Notify.onInfo, false);
document.body.addEventListener("meccg-notify-error", Notify.onError, false);

jQuery(document).ready(Notify.init);