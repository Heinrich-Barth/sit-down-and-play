
const ReadDeck = require("../../../game-client/deck/read");

describe('Convert GCCG Deck', () => {

    const fs = require('fs');
    const sampleDeck = fs.readFileSync(__dirname + "/deck.txt").toString();
    
    it('isJson()', () => {
        expect(ReadDeck.isJson("{")).toBeTruthy();
        expect(ReadDeck.isJson(sampleDeck)).toBeFalsy();
    });

    it('isTextDeck()', () => {
        expect(ReadDeck.isTextDeck("{")).toBeFalsy();
        expect(ReadDeck.isTextDeck(sampleDeck)).toBeTruthy();
    });

    it('extractNumber()', () => {
        expect(ReadDeck.extractNumber("1 The Blue Tree")).toEqual(1);
        expect(ReadDeck.extractNumber("The Blue Tree")).toEqual(0);
    });

    it('extractCardCode()', () => {
        expect(ReadDeck.extractCardCode("1 The Blue Tree")).toEqual("The Blue Tree");
        expect(ReadDeck.extractCardCode("The Blue Tree")).toEqual("Blue Tree");
    });

    it('ignoreLine()', () => {
        expect(ReadDeck.ignoreLine("1 The Blue Tree")).toBeFalsy();
        expect(ReadDeck.ignoreLine("")).toBeTruthy();
        expect(ReadDeck.ignoreLine("# whatever")).toBeTruthy();
    });
    
    it('addToDeckEntry()', () => {
        const deck = {};
        const key = "name";

        ReadDeck.addToDeckEntry(deck, key, 0);
        expect(deck[key]).toBeUndefined();

        ReadDeck.addToDeckEntry(deck, key, 1);
        expect(deck[key]).toEqual(1);

        ReadDeck.addToDeckEntry(deck, key, 10);
        expect(deck[key]).toEqual(11);
    });

    it('extractDeckPart()', () => {

        let result = ReadDeck.extractDeckPart(sampleDeck, "Pool");
        expect(result.startsWith("# Hero Character (5)")).toBeTruthy();
        expect(result.endsWith("1 Horn of Anor (TW)")).toBeTruthy();

        result = ReadDeck.extractDeckPart(sampleDeck, "Sites");
        expect(result.startsWith("# Hero Site (15)")).toBeTruthy();
        expect(result.endsWith("1 Wellinghall [H] (TW)")).toBeTruthy();
    });

    it('extractDeckSectionSpecifica()', () => {

        let result = ReadDeck.extractDeckSectionSpecifica(sampleDeck, "Hazard");
        expect(result.startsWith('1 "Bert" (Bûrat) (TW)')).toBeTruthy();
        expect(result.endsWith("1 Two or Three Tribes Present (DM)")).toBeTruthy();

        result = ReadDeck.extractDeckSectionSpecifica(sampleDeck, "Character");
        expect(result.startsWith("1 Balin (TW)")).toBeTruthy();
        expect(result.endsWith("1 Théoden (TW)")).toBeTruthy();
    });
    
    it('convertDeck()', () => {
        
        const result = ReadDeck.convertDeck(sampleDeck);
        expect(Object.keys(result.pool).length).toEqual(7);
        expect(Object.keys(result.sideboard).length).toEqual(15);
        expect(Object.keys(result.hazards).length).toEqual(16);
        expect(Object.keys(result.characters).length).toEqual(6);
        expect(Object.keys(result.resources).length).toEqual(20);
    });

});