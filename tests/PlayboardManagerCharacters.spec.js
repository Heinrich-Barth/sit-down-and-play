
const PlayboardManagerCharacters = require("../game-server/PlayboardManagerCharacters");


describe('Test Default Value', () => {
    
    it("popCharacterCards", () => {

        const instance = new PlayboardManagerCharacters([], {}, {}, false);

        const uuid = "uu1";
        const companyId = "c1";
        
        expect(instance.popCharacterCards(uuid).length).toEqual(0);
        
        instance.addNewCharacter(uuid, companyId)
        expect(instance.popCharacterCards(uuid).length).toEqual(1);

        const charTest = instance.getOrCreateCharacter(uuid, "company");
        charTest.resources.push("r1");
        charTest.hazards.push("h1");

        const pPopped = instance.popCharacterCards(uuid);
        expect(pPopped.length).toEqual(3);
    });
    
    it("createNewCharacter", () => {

        const instance = new PlayboardManagerCharacters([], {}, {}, false);

        const uuid = "uu1";
        const companyId = "c1";
        const pChar = instance.createNewCharacter(companyId, uuid);
        
        expect(pChar.companyId).toEqual(companyId);
        expect(pChar.character).toEqual(uuid);
        expect(pChar.uuid).toEqual(uuid);
        expect(pChar.resources.length).toEqual(0);
        expect(pChar.hazards.length).toEqual(0);
    });


    it("createCompanyCharacter", () => {

        const instance = new PlayboardManagerCharacters([], {}, {}, false);

        const uuid = "uu1";
        const listInfluencedUUids = ["a1", "a2"];

        const pChat = instance.createCompanyCharacter(uuid, listInfluencedUUids);
        expect(pChat.uuid).toEqual(uuid);
        
        expect(pChat.influenced.length).toEqual(2);
        expect(pChat.influenced.includes("a1")).toEqual(true);
        expect(pChat.influenced.includes("a2")).toEqual(true);
    });

    
});