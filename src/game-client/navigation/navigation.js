
const Navigation = {

    insertCss : function()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/media/assets/css/navigation.css");
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

        if (!document.body.classList.contains("navigation-full-width"))
            document.body.classList.add("navigation-toggled");

        const label = document.createElement("label");
        label.setAttribute("for", "navigation_toggle");
        label.innerHTML = `Navigation <i class="fa fa-bars" aria-hidden="true"></i>`;

        const input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        input.setAttribute("id", "navigation_toggle");

        const div = document.createElement("div");
        div.setAttribute("class", "navigation");
        div.setAttribute("id", "main-navigation");

        const nav = document.createElement("ul");

        const target = Navigation.isGame() ? 'target="_blank"' : "";
        const linkIcon = Navigation.isGame() ? '<i class="fa fa-external-link-square" aria-hidden="true"></i>' : "";

        for (let _elem of json)
        {
            if (window.location.pathname !== _elem.url)
            {
                let _target = target;
                if (target === "" && _elem.blank)
                    _target = 'target="_blank"';

                const li = document.createElement("li");
                li.innerHTML = `<a rel="nofollow" href="${_elem.url}" ${_target}>${linkIcon} ${_elem.label}</a>`
                nav.appendChild(li);
            }
        }
        
        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(nav);
        document.body.prepend(div);

        if (Navigation.isOpenByDefault())
            input.click();
    }
};

(function()
{
    fetch("/data/navigation").then((response) => response.json().then(Navigation.init)).catch(console.log);
})();