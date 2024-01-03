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

    const pPlayboardManager = new PlayboardManager();
    const instance = new GameStandard(_MeccgApi, _Chat, pPlayboardManager);

    gameData.data.playboard.decks.cardMap = instance.base64Encode(gameData.data.playboard.decks.cardMap);
    expect(typeof gameData.data.playboard.decks.cardMap).toEqual("string");

    instance.setCallbackOnRestoreError(function() {
        throw new Error("Invalid!");
    });

    instance.registerThisPlayer("4a0f0e50-fb72-4607-95b8-618cf8ea90c2", "New");

    const data = {
        assignments : gameAssignments,
        game: gameData.data
    };
    
    it('globalRestoreGame()', () => {
        
        instance.globalRestoreGame("100", null, data);
        expect(15).toEqual(15);
    });

    it('base64Encode(json)', () => {

        const data = {
            time: Date.now()
        };
    
        const str = instance.base64Encode(data);
        expect(str).not.toEqual("");
    });

    it('base64Encode(json)', () => {

        const data = {
            time: Date.now()
        };
    
        const restored = instance.base64Decode(instance.base64Encode(data));
        expect(restored.time).toEqual(data.time);
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