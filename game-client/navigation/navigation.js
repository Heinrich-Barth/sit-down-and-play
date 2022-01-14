
const Navigation = {

    insertCss : function()
    {
        var styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("href", "/media/client/navigation/navigation.css");
        document.head.appendChild(styleSheet)
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

        const len = json.length;
        for (let i = 0; i < len; i++)
        {
            const li = document.createElement("li");
            li.innerHTML = `<a href="${json[i].url}" ${target}>${linkIcon} ${json[i].label}</a>`
            nav.appendChild(li);
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