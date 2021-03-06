const Scores = require("./Scores");

const GameBase = require("./GameBase");
const PlayerDices = require("./PlayerDices");

class GamePlayers extends GameBase
{
    constructor(_MeccgApi, _Chat, _playboardManager)
    {
        super(_MeccgApi, _Chat, _playboardManager)        

        this.players = {

            this_player_name: "",
            this_player: "",
            ids: [],
            names: {},
            current: 0,
            turn: 1
        };

        this.scoring = new Scores(this.isArda());
        this.playerDices = new PlayerDices();
    }

    getPlayerDices()
    {
        return this.playerDices;
    }

    updateDices(userid, dice)
    {
        this.getPlayerDices().setDice(userid, dice);
    }

    joinGame(playerName, playerId, cards)
    {
        if (cards === null || playerName === "" || playerId === "" || !this.setupNewGame())
            return false;
        else
        {
            this.addOpponent(playerId, playerName);
            return this.getPlayboardManager().AddDeck(playerId, cards);
        }
    }

    save()
    {
        let data = super.save();

        data.meta.players = {
            ids: this.players.ids,
            names: this.players.names,
            current : this.players.current,
            turn: this.players.turn,
        }

        data.scoring = this.scoring.save();
        return data;
    }

    restorePlayerPhase(phase, turn, current)
    {
        super.restorePlayerPhase(phase, turn, current);

        this.players.turn = parseInt(turn);
        this.players.current = parseInt(current);
    }

    getPlayerScore(player)
    {
        return this.scoring.getPlayerScore(player)
    }

    registerThisPlayer(sId, sName)
    {
        this.players.this_player = sId;
        this.players.this_player_name = sName;
        this.addOpponent(sId, sName);
    }

    addOpponent(sId, sName)
    {
        this.players.ids.push(sId);
        this.players.names[sId] = sName;
        this.scoring.add(sId);
    }

    getCurrentPlayerId()
    {
        return this.players.ids[this.players.current];
    }

    getCurrentPlayerName()
    {
        return this.players.names[this.getCurrentPlayerId()];
    }

    moveNext()
    {
        this.players.current++;
        if (this.players.current >= this.players.ids.length)
        {
            this.players.turn++;
            this.players.current = 0;
        }

        return this.getCurrentPlayerId();
    }

    reset()
    {
        super.reset();
        this.players.this_player = "";
        this.players.ids = [];
        this.players.current = 0;
        this.players.turn = 1;
        this.scoring.reset();
    }
    restore(playboard, score)
    {
        return super.restore(playboard) && this.scoring.restore(score);
    }
    currentIsMe ()
    {
        return this.getCurrentPlayerId() === this.players.this_player;
    }

    getPlayerIds()
    {
        return this.players.ids;
    }

    getCount()
    {
        return this.players.ids.length
    }

    getNameMap ()
    {
        return this.players.names;
    }

    isMyTurn()
    {
        return this.currentIsMe();
    }

    nextPlayersTurn()
    {
        return this.moveNext();
    }

    removePlayer(userId)
    {
        const nSize = this.players.ids.length;
        if (nSize <= 1)
            return false;

        let _ids = [];
        let players = this.players.ids;
        let _posDel = -1;

        /** create a new array of players and exclude the player to be removed */
        const sizePlayers = players.length;
        for (let i = 0; i < sizePlayers; i++)
        {
            if (players[i] === userId)
                _posDel = i;
            else
                _ids.push(players[i]);
        }

        /** check if the player has been in the list at all */
        if (_posDel < 1)
            return false;

        /** update player id array and remove player from map */
        this.players.ids = _ids;
        if (this.players.names[userId] !== undefined)
            delete this.players.names[userId];

        /** it might be that the removed player had its turn already. hence, the current player moved on place to the left */
        if (this.players.current !== 0 && this.players.current >= _posDel)
            this.players.current--;

        /** all done. the player has left the game and we can now send the update */
        console.log("Player kicked from index list: " + userId)
        this.publishToPlayers("/game/player/remove", "", { userid: userId });
        return true;
    }

    getCurrentTurn()
    {
        return this.players.turn;
    }

    getScoring()
    {
        return this.scoring;
    }

    getFinalScore()
    {
        return {
            score: this.scoring.getScoreSheets(),
            stats: this.playerDices.getStats()
        };
    }

    sendPlayerList()
    {
        let userid = this.getCurrentPlayerId();
        this.publishToPlayers("/game/set-player-names", userid, this.getNameMap());
        this.publishToPlayers("/game/time", userid, { time : this.getGameOnline() });
    }
}

module.exports = GamePlayers;
