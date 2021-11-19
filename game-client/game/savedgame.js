
const SavedGameManager = 
{
    _currentGame : null,

    onRestoreSavedGame : function()
    {
        const table = document.getElementById("restore-panel-table");
        const list = table.querySelectorAll("select");

        let assignedPlayers = { };

        for (let select of list)
        {
            if (select.value === "")
            {
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Assign players first!" }));
                return;
            }
            else if (assignedPlayers[select.value] !== undefined)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Duplicate player assignment detected" }));
                return;
            }
            else
                assignedPlayers[select.value] = select.getAttribute("data-current-player");
        }

        SavedGameManager.removeOverlay();
        SavedGameManager.performRestoration(SavedGameManager._currentGame, assignedPlayers);
    },

    performRestoration : function(jGame, jAssignments)
    {
        MeccgApi.send("/game/restore", { assignments : jAssignments, game : jGame });
    },

    removeOverlay : function()
    {
        DomUtils.removeNode(document.getElementById("restore-game"));
    },

    onRestoreGame : function(jGame)
    {
        let pPlayersCurrent = MeccgPlayers.getPlayers();
        let pPlayersSaved = jGame.players;
        const sizeSaved = Object.keys(pPlayersSaved).length;
        const sizeCurrent = Object.keys(pPlayersCurrent).length;
        if (sizeSaved !== sizeCurrent)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Player number missmatch!<br>Saved game: " + sizeSaved + "<br>Currently: " + sizeCurrent }));
            return;
        }

        SavedGameManager._currentGame = jGame.data;

        const div = document.createElement("div");
        div.setAttribute("id", "restore-game");
        div.setAttribute("class", "restore-game config-panel");
        div.innerHTML = `<div class="config-panel-overlay" title="click here to cancel" id="restore-panel-overlay"></div>
                        <div class="config-panel blue-box restore-panel" id="restore-panel">
                            <h2>Assign players</h2>
                            <p>Please choose which player from the saved game represents which player at the current table</p>
                            <table id="restore-panel-table">
                                <thead>
                                <tr>
                                    <th class="entry">Current Game</th>
                                    <th></th>
                                    <th class="entry">Saved Game</th>
                                </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>
                            <button type="button" class="button-small" id="button_restore_game"><i class="fa fa-check-circle" aria-hidden="true"></i> Restore saved game</button>
                        </div>`;

        document.body.appendChild(div);

        document.getElementById("restore-panel-overlay").onclick = SavedGameManager.removeOverlay;
        document.getElementById("button_restore_game").onclick = SavedGameManager.onRestoreSavedGame;

        let table = document.getElementById("restore-panel-table");
        table = table.querySelector("tbody");

        let _td;
        for (let key of Object.keys(pPlayersCurrent))
        {
            const _tr = document.createElement("tr");
            
            _td = document.createElement("td");
            _td.innerHTML = pPlayersCurrent[key];
            _tr.appendChild(_td);
            
            _td = document.createElement("td");
            _td.innerHTML = " = ";
            _td.setAttribute("class", "center");
            _tr.appendChild(_td);

            _td = document.createElement("td");
            _td.appendChild(this.createSelectCurrentPlayers(pPlayersSaved, key, pPlayersCurrent[key]));
            _tr.appendChild(_td);

            table.appendChild(_tr);
        }
    },

    createSelectCurrentPlayers : function(pPlayers, _currentPlayerId, _name)
    {
        const select = document.createElement("select");
        select.setAttribute("data-current-player", _currentPlayerId);

        let option = document.createElement("option");
        option.text = "Assign player from savegame"
        option.value = "";
        select.add(option);

        for (let key of Object.keys(pPlayers))
        {
            option = document.createElement("option");
            option.text = pPlayers[key] + " (savegame)";
            option.value = key;
            if (_name === pPlayers[key])
                option.selected = true;

            select.add(option);
        }

        return select;
    },


    onRequestLoad : function()
    {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.onchange = function() 
        {
            let files = this.files;
            if (files.length != 1)
                return;
  
            const reader = new FileReader();
            reader.onload = (e) => SavedGameManager.onRestoreGame(JSON.parse(e.target.result));
            reader.onerror = (e) => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not load game file." }));
            reader.readAsText(files[0]);
        };

        input.click();
    },

    onRequestSave : function()
    {
        MeccgApi.send("/game/save", {});
    },

    obtainPlayerNames : function(jGame)
    {
        let names = [];

        for (let key of Object.keys(jGame.meta.players.names))
            names.push(jGame.meta.players.names[key]);
    },

    obtainSaveName : function(jGame)
    {
        let name = "";
        let del = "";

        for (let key of Object.keys(jGame.meta.players.names))
        {
            name += del + jGame.meta.players.names[key];
            del = "-";
        }

        const sDate = new Date().toISOString().replace("T", "-").replace(":","-").replace(":", "-");
        return name + "---" + sDate;
    },

    onRestored : function(jRes)
    {
        if (jRes === undefined || !jRes.success)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not restore saved game!" }));
        else
            window.location.reload();
    },

    onSaveGame : function(jGame)
    {
        if (jGame === undefined || jGame === null)
            return;

        try
        {
            const gameData = {
                players: jGame.meta.players.names,
                date: new Date().toISOString(),
                arda : jGame.meta.arda,
                data: jGame
            }
            const det = {
                name : this.obtainSaveName(jGame),
                data: gameData
            };
        
            document.body.dispatchEvent(new CustomEvent("meccg-saveas-file", { "detail": det}));
        }
        catch (err)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not save game." }));
            console.log(err);
        }
    }
};

MeccgApi.addListener("/game/save", (bIsMe, jData) => SavedGameManager.onSaveGame(jData));
MeccgApi.addListener("/game/restore", (bIsMe, jData) => SavedGameManager.onRestored(jData));

document.body.addEventListener("meccg-game-save-request", SavedGameManager.onRequestSave, false);
document.body.addEventListener("meccg-game-restore-request", SavedGameManager.onRequestLoad, false);
