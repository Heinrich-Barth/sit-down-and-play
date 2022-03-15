class PageRefreshInfo 
{
    constructor()
    {
        this.visible = false;
        this.question = new Question("fa-exclamation-circle").addClass("notification-line-countdown-10s").onOk(this.onRefresh.bind(this));
    }

    onRefresh()
    {
        if (this.isVisible())
            window.location.reload();
    }

    isVisible()
    {
        return this.question.isVisible();
    }

    show()
    {
        if (this.isVisible())
            return;

        this.question.show("Connectivity Problem", 
              "It seems the connection to the server was lost.<br><br>This page will be reloaded in 10 seconds", 
              "Reload now");

        setTimeout(this.onRefresh.bind(this), 1000 * 10);
    }

}

