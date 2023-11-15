
const SavedGameManager = 
{
    _currentGame : null,
    _autosave: false,

    hasAutoSave()
    {
        return SavedGameManager._autosave;
    },

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
        if (typeof jGame.check !== "string" || typeof jGame.game !== "string")
        {
            this.onRestoreGameJson(jGame);
            return;
        }

        if (jGame.check === "" || jGame.game === "")
            throw new Error("Invalid savegame properties.");

        SavedGameManager.digestMessage(jGame.game).then((digestHex) => {
            const options = {
                method: 'POST',
                body: JSON.stringify({ value: digestHex }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        
            fetch("/data/hash", options)
            .then((response) => response.json())
            .then((response) => 
            {
                if (response.value !== jGame.check)
                    throw new Error("Invalid savegame signature");
                else
                    this.onRestoreGameJson(JSON.parse(atob(jGame.game)));
            })
            .catch((err) => {
                console.error(err);
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not restore game: " + err.message }));
            });
        });

        
    },

    onRestoreGameJson : function(jGame)
    {
        let pPlayersCurrent = MeccgPlayers.getPlayers();
        let pPlayersSaved = jGame.players;
        console.info(jGame)
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

    onRequestSaveAuto : function()
    {
        if (SavedGameManager._autosave)
            document.body.dispatchEvent(new CustomEvent("meccg-saveas-file-autosave"));
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "No autosave available." }));
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

    digestMessage: async function(message) 
    {
        /** this is a sample from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest  */
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
    },

    onSaveGameAuto : function(jGame)
    {
        this.doSaveGame(jGame, (data) => 
        {
            if (data === null)
                return;

            SavedGameManager._autosave = true;
            document.body.dispatchEvent(new CustomEvent("meccg-saveas-autosave", { "detail": data}));
            document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
                name : "System",
                message : "Autosaved current game."
            }}));
        });
    },

    onSaveGame : function(jGame)
    {
        this.doSaveGame(jGame, (data) => 
        {
            if (data !== null)
                document.body.dispatchEvent(new CustomEvent("meccg-saveas-file", { "detail": data}));
        });
    },

    doSaveGame : function(jGame, callback)
    {
        if (jGame === undefined || jGame === null || Object.keys(jGame).length === 0)
            return;

        try
        {
            const gameData = {
                players: jGame.meta.players.names,
                date: new Date().toISOString(),
                arda : jGame.meta.arda,
                data: jGame
            }
            const base64 = btoa(JSON.stringify(gameData));
            const det = {
                name : this.obtainSaveName(jGame),
                data: {
                    game: base64,
                    check: ""
                }
            };

            SavedGameManager.digestMessage(base64).then((digestHex) => 
            {
                const options = {
                    method: 'POST',
                    body: JSON.stringify({ value: digestHex }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            
                fetch("/data/hash", options)
                .then((response) => response.json())
                .then((response) => det.data.check = response.value)
                .catch(err => 
                {
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not autosave." }));
                    console.error(err);
                })
                .finally(() => callback(det));
            });
        }
        catch (err)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not save game." }));
            console.error(err);
            callback(null);
        }
    }
};

MeccgApi.addListener("/game/save", (bIsMe, jData) => SavedGameManager.onSaveGame(jData));
MeccgApi.addListener("/game/save/auto", (bIsMe, jData) => SavedGameManager.onSaveGameAuto(jData));
MeccgApi.addListener("/game/restore", (bIsMe, jData) => SavedGameManager.onRestored(jData));

document.body.addEventListener("meccg-game-save-request", SavedGameManager.onRequestSave, false);
document.body.addEventListener("meccg-game-save-auto-to-disk", SavedGameManager.onRequestSaveAuto, false);
document.body.addEventListener("meccg-game-restore-request", SavedGameManager.onRequestLoad, false);
