const CardRepository = require("./CardRepository")
const fs = require("fs");


describe('CardRepository', () => {

    const jsonFile = require("path").resolve(__dirname + "/../data-local/cards.json");
    const cards = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));

    test("assertExists", () => expect(fs.existsSync(jsonFile)).toBeTruthy());
    test("assertCards", () => expect(cards).not.toBeNull())

    test('removeUnwantedCardRepository', () => 
    {
        const instance = new CardRepository();
        const result = instance.removeUnwantedCardRepository(cards);
        expect(result.length).toEqual(4336);
    });

});