const GameStandard = require("../game-management/GameStandard");
const PlayboardManager = require("../game-management/PlayboardManager");

describe('globalRestoreGame(userid, socket, data)', () => {

    const fs = require("fs");
    const gameData = JSON.parse(fs.readFileSync(__dirname + "/savegame/example-saved.json"));

    const gameAssignments = {};
    Object.keys(gameData.players).forEach((_e) => gameAssignments[_e] = _e);

    const _MeccgApi = {
        publish: function()
        {
            /** not needed */
        }
    }
    const _Chat = {
        sendMessage : function()
        {
            /** not needed */
        }
    }
    const eventManager = { trigger: function() { /** not needed */ } };
    const pPlayboardManager = new PlayboardManager([], eventManager, {}, false);
    const instance = new GameStandard(_MeccgApi, _Chat, pPlayboardManager)

    instance.setCallbackOnRestoreError(function() {
        throw new Error("Invalid!");
    });

    instance.registerThisPlayer("4a0f0e50-fb72-4607-95b8-618cf8ea90c2", "New");

    const data = {
        assignments : gameAssignments,
        game: gameData.data
    };
    
    it('getDices()', () => {
        
        instance.globalRestoreGame("100", null, data);
        expect(15).toEqual(15);
    });
});

describe('identifyCardOwnerWhenMoving(userid, cardOwner, target)', () => {

    const instance = new GameStandard();

    it('identifyCardOwnerWhenMoving()', () => {
        
        expect(instance.identifyCardOwnerWhenMoving("userid", "cardOwner", "victory")).toEqual("userid");
        expect(instance.identifyCardOwnerWhenMoving("userid", "cardOwner", "hand")).toEqual("userid");
        expect(instance.identifyCardOwnerWhenMoving("userid", "cardOwner", "play")).toEqual("cardOwner");
    });
});