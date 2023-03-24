
const History = {

    insertHtml : function(list)
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/media/client/home/history.css");
        document.head.appendChild(styleSheet);

        //
        const parent = document.getElementById("game-list-wrapper");
        if (parent === null)
            return;

        const div = document.createElement("div");
        const h2 = document.createElement("h2");
        div.setAttribute("class", "game-list game-list-history")
        h2.innerText = "Checkout past game logs"
        div.appendChild(h2);
        div.appendChild(this.addGames(list));

        parent.appendChild(div);
    },

    splitLogName(name)
    {
        const parts = name.split("-");
        
        let _time = "";
        let _room = "";

        if (parts.length < 2)
        {
            _time = name.replace(".txt", "");
        }
        else
        {
            _time = parts[0];
            _room = parts[1].replace(".txt", "");
        }

        return {
            date: new Date(this.toInt(_time)).toUTCString(),
            room: _room
        };
    },

    toInt(val)
    {
        try
        {
            if (!isNaN(val))
                return parseInt(val);
        }
        catch (errIgnore)
        {

        }

        return Date.now();
    },

    addGames(list)
    {
        const table = document.createElement("table");

        const container = document.createElement("tbody");
        table.appendChild(container);

        list.sort();
        for (let game of list)
        {
            const data = this.splitLogName(game);
            const _tr = document.createElement("tr");
            container.appendChild(_tr);
            _tr.innerHTML = `
                            <td class="game-log-time"><a href="/logs/${game}" title="Click to read game log" target="_blank" class="fa fa-eye"> ${data.date}</a></td>
                            <td class="game-log-name"><a href="/logs/${game}" title="Click to read game log" target="_blank">${data.room}</a></td>
                            `.trim();
        }

        return table;
    },


    init: function(list)
    {
        if (list.length > 0)
            this.insertHtml(list);
    }
};

(function()
{
    fetch("/games/history")
    .then((response) => response.json())
    .then(History.init.bind(History))
    .catch(console.error);

})();