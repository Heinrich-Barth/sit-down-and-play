const CardNameCodeSuggestions = require("./CardNameCodeSuggestions");
const fs = require("fs");


describe('CardNameCodeSuggestions', () => {

    const jsonFile = require("path").resolve(__dirname + "/../data-local/cards.json");
    const cards = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));

    test("assertExists", () => expect(fs.existsSync(jsonFile)).toBeTruthy());
    test("assertCards", () => expect(cards).not.toBeNull())

    test('create(list)', () => 
    {
        const instance = new CardNameCodeSuggestions();
        const result = instance.create(cards);
        expect(Object.keys(result).length).toEqual(3818);

        const list = result["gandalf"];
        expect(list.length).toEqual(2);
        expect(list.includes("gandalf [f] (wh)")).toBeTruthy();
        expect(list.includes("gandalf [h] (tw)")).toBeTruthy();
    });

});