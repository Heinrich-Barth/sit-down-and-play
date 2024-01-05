
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

    isOpenByDefault : function()
    {
        return "open" == document.body.getAttribute("data-navigation-type");
    },

    init : function(json)
    {
        if (!Array.isArray(json) || json.length === 0)
            return;

        Navigation.insertCss();

        const nav = document.createElement("ul");

        const target = Navigation.isGame() ? "_blank" : "";

        for (let _elem of json)
        {
            let _target = target;
            if (target === "" && _elem.blank)
                _target = "_blank";

            const li = document.createElement("li");
            const _a = document.createElement("a");
            _a.setAttribute("href", _elem.url);
            _a.setAttribute("rel", "nofollow");
            _a.innerText = _elem.label;

            if (_target !== "")
                _a.setAttribute("target", "_target");

            if (window.location.pathname.startsWith(_elem.url))
                _a.setAttribute("class", "navigation-active");

            li.append(_a);

            nav.appendChild(li);
        }
        
        const div = document.createElement("div");
        div.setAttribute("class", "navigation");
        div.setAttribute("id", "main-navigation");

        div.appendChild(nav);
        document.body.prepend(div);

        if (Navigation.isOpenByDefault())
            input.click();
    }
};

(function()
{
    fetch("/data/navigation").then((response) => response.json()).then(Navigation.init.bind(Navigation)).catch(console.error);
})();