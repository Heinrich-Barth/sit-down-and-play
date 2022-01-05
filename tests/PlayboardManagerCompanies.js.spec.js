const PlayboardManagerCompanies = require("../game-server/PlayboardManagerCompanies");

describe('PlayboardManagerCompanies', () => {
    
    
    it("createNewCompany", () => {

        const instance = new PlayboardManagerCompanies([], {}, {}, false);

        const companyId = "c1";
        const playerId = "p1";
        const pCharacter = "ppp";
        const startingLocation = "s1";

        const pCompany = instance.createNewCompany(companyId, playerId, pCharacter, startingLocation)
        expect(pCompany.id).toEqual(companyId);
        expect(pCompany.playerId).toEqual(playerId);
        expect(pCompany.characters.length).toEqual(1);
        expect(pCompany.characters.includes(pCharacter)).toEqual(true);
        expect(pCompany.sites.current).toEqual(startingLocation);
        expect(pCompany.sites.target).toEqual("");
        expect(pCompany.sites.regions.length).toEqual(0);
        expect(pCompany.sites.attached.length).toEqual(0);
    });

    it("createNewCompanyWithCharacter", () => {

        const instance = new PlayboardManagerCompanies([], {}, {}, false);
        const hostUuid = "uu1";
        const companyId = "c1";
        const playerId = "p1";
        const startingLocation = "s1";

        const pCompany = instance.createNewCompanyWithCharacter(companyId, playerId, hostUuid, ["a1","a2"], startingLocation)
        expect(pCompany.id).toEqual(companyId);
        expect(pCompany.playerId).toEqual(playerId);
        expect(pCompany.characters.length).toEqual(1);
        expect(pCompany.sites.current).toEqual(startingLocation);
        expect(pCompany.sites.target).toEqual("");
        expect(pCompany.sites.regions.length).toEqual(0);
        expect(pCompany.sites.attached.length).toEqual(0);
    });
    
});
