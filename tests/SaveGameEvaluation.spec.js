

const SaveGameEvaluation = require("../game-management/SaveGameEvaluation");

describe('SaveGameEvaluation', () => {

    const data = JSON.parse(require("fs").readFileSync(__dirname + "/savegame/invalid.json"));
    

    it("assertGameProperties(game)", () => 
    {
        const instance = new SaveGameEvaluation(data.assignments);
        expect(instance.assertGameProperties(data.game)).toBeTruthy();
        expect(instance.assertGameProperties({})).toBeFalsy();
        expect(instance.assertGameProperties()).toBeFalsy();
    });

    
    it('evaluateCardMap()', () => {
        
        let playboard = {
            decks : {
                cardMap : {

                }
            }
        };

        let instance = new SaveGameEvaluation({"a" : "b"});
        expect(instance.evaluateCardMap(playboard)).toBeFalsy();

        playboard.decks.cardMap["9be7c549-1e92-4790-a0af-7aef08030050_d1"] = {
            "owner": "9be7c549-1e92-4790-a0af-7aef08030050"
        }

        expect(instance.evaluateCardMap(playboard)).toBeFalsy();

        playboard.decks.cardMap["9be7c549-1e92-4790-a0af-7aef08030050_d1"] = {
            "owner": "a"
        }

        expect(instance.evaluateCardMap(playboard)).toBeTruthy();
    });

    it("clearMap(siteMap)", () => 
    {
        let instance = new SaveGameEvaluation({"a" : "b"});
        let siteMap = {
            "590230dd-30fa-4622-81bb-dd8d6abf64ba": {
                "MySite [H] (TW)": true
            }
        };

        expect(Object.keys(siteMap).length).toEqual(1);
        expect(instance.clearMap(siteMap)).toBeTruthy();
        expect(Object.keys(siteMap).length).toEqual(0);

        siteMap = {
            "a": {
                "MySite [H] (TW)": true
            }
        };
        expect(instance.clearMap(siteMap)).toBeTruthy();
    });

    it("evaluateCompanies(companies)", () =>
    {
        let instance = new SaveGameEvaluation({"a" : "b"});
        let companies = {
            "company_1": {
                "id": "company_1",
                "playerId": "9be7c549-1e92-4790-a0af-7aef08030050",
                "characters": []
            }
        };
        expect(instance.evaluateCompanies({ })).toBeFalsy();
        expect(instance.evaluateCompanies(companies)).toBeFalsy();

        companies = {
            "company_1": {
                "id": "company_1",
                "playerId": "a",
                "characters": []
            }
        };
        expect(instance.evaluateCompanies(companies)).toBeFalsy();

        companies = {
            "company_1": {
                "id": "company_1",
                "playerId": "a",
                "characters": ["test"]
            }
        };
        expect(instance.evaluateCompanies(companies)).toBeTruthy();
    });

    it('evaluate()', () => {
        const instance = new SaveGameEvaluation(data.assignments);
        expect(instance.evaluate(data.game, true)).toBeNull();
        expect(instance.evaluate(data.game, false)).toHaveProperty("playboard");
    });
});