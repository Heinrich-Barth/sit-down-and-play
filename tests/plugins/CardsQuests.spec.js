
const CardsQuest = require("../../plugins/CardsQuests");


const readJson = function()
{
    try
    {
        const fs = require('fs');
        return JSON.parse(fs.readFileSync(__dirname + "/../../data/cards-raw.json", 'utf8'));
    }
    catch (e)
    {
        /** not available */
    }

    return [];
}

describe('Quests', () => {
    
    it('identifyQuests()', () => {

        const json = readJson();
        const list = CardsQuest.identifyQuests(json);

        const keys = Object.keys(list);
        if (json.length === 0)
            expect(keys.length).toEqual(0);
        else 
            expect(keys.length).toBeGreaterThan(0);

        for (let key of keys)
        {
            expect(key.length).toBeGreaterThan(0);
            expect(list[key].length).toBeGreaterThan(0);
        }
    });
});