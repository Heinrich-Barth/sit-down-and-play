const PlayerDices = require("../game-management/PlayerDices");

describe('Test', () => {
    
    it('getAvailableDices()', () => {

        const pInstance = new PlayerDices();
        
        let list = pInstance.getAvailableDices();
        expect(list.length).toEqual(15);
    });

    it("getDices()", () => {

        const pInstance = new PlayerDices();
        
        let list = pInstance.getDices();
        expect(Object.keys(list).length).toEqual(0);
    });

    it("roll()", () => {

        const pInstance = new PlayerDices();
        
        for (let i = 0; i < 100; i++)
        {
            let val = pInstance.roll();
            expect(val > 0).toBeTruthy();
            expect(val < 7).toBeTruthy();
        }

    });
    it("getRandom()", () => {

        const pInstance = new PlayerDices();
        
        for (let i = 0; i < 100; i++)
        {
            let val = pInstance.getRandom();
            expect(val > 0).toBeTruthy();
            expect(val < 7).toBeTruthy();
        }

        const MAX = 100;
        for (let i = 0; i < 100; i++)
        {
            let val = pInstance.getRandom(MAX);
            expect(val > 0).toBeTruthy();
            expect(val < MAX+1).toBeTruthy();
        }
    });
    
    it("roll100 times", () => {

        const pInstance = new PlayerDices();
        let res = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0,
            "6": 0
        }     

        for (let i = 0; i < 100; i++)
        {
            let val = pInstance.roll();
            res["" + val]++;
        }

        console.log(res);
        expect(true).toBeTruthy();

    });

    it("setDice/getDice()", () => {

        const pInstance = new PlayerDices();
        
        expect(pInstance.setDice()).toBeFalsy();
        expect(pInstance.setDice("", "")).toBeFalsy();

        let list = pInstance.getAvailableDices();
        let dice1 = list[list.length-1];
        let dice2 = dice1 + "x";

        expect(pInstance.setDice("player", dice2)).toBeFalsy();
        expect(pInstance.setDice("player", dice1)).toBeTruthy();

        list = pInstance.getDices();
        expect(Object.keys(list).length).toEqual(1);
        expect(list["player"]).toEqual(dice1);
        
        expect(pInstance.getDice("player")).toEqual(dice1);
        expect(pInstance.getDice("")).toEqual("");
    });


    it("saveRoll/getStats()", () => {

        const user = "userid";
        const pInstance = new PlayerDices();

        let stats = pInstance.getStats();
        expect(Object.keys(stats).length).toEqual(0);
        
        for (let i = 1; i < 13; i++)
            expect(pInstance.saveRoll(user, i)).toBeTruthy();

        expect(pInstance.saveRoll(user, 3)).toBeTruthy();

        expect(Object.keys(stats[user]).length).toEqual(12);
        expect(stats[user]["1"]).toEqual(1);
        expect(stats[user]["3"]).toEqual(2);
    });

});
