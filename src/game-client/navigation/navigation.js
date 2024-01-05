
const Navigation = {

    insertCss : function()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/media/assets/css/navigation.css?t=" + Date.now());
        document.head.appendChild(styleSheet);
    },

    isGame : function()
    {
        return document.body.getAttribute("data-is-game") === "true";
    },

    getTarget : function(elem)
    {
        if (Navigation.isGame() || elem.blank)
            return "_blank";
        else
            return "";
    },

    isCurrentNavigation : function(uri)
    {
        return window.location.pathname.startsWith(uri);
    },

    insertHtml : function(json)
    {
        const nav = document.createElement("ul");
        
        for (let _elem of json)
        {
            const _a = document.createElement("a");
            _a.innerText = _elem.label;

            _a.setAttribute("href", _elem.url);
            _a.setAttribute("rel", "nofollow");

            const _target = this.getTarget(_elem);
            if (_target !== "")
                _a.setAttribute("target", "_target");

            if (this.isCurrentNavigation(_elem.url))
                _a.setAttribute("class", "navigation-active");

            const li = document.createElement("li");
            li.append(_a);
            nav.appendChild(li);
        }
        
        const div = document.createElement("div");
        div.setAttribute("class", "navigation");
        div.appendChild(nav);
        document.body.prepend(div);
    },

    init : function(json)
    {
        if (!Array.isArray(json) || json.length === 0)
            return;

        this.insertCss();
        this.insertHtml(json);        
    }
};

(function()
{
    fetch("/data/navigation").then((response) => response.json()).then(Navigation.init.bind(Navigation)).catch(console.error);
})();