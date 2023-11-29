
const Configuration = require("../Configuration")

describe('Configuration', () => {
    
    it('extractDomain', () => {
        expect(Configuration.extractDomain(undefined)).toEqual("");
        expect(Configuration.extractDomain("undefined")).toEqual("");
        expect(Configuration.extractDomain("http://test.com/")).toEqual("http://test.com");
        expect(Configuration.extractDomain("http://test.com/data")).toEqual("http://test.com");
    });

    it('construct empty', () => {

        const instance = Configuration;

        expect(instance.port()).toEqual(8080);
        expect(instance.maxRooms()).toEqual(10);
        expect(instance.maxPlayersPerRoom()).toEqual(10);
        expect(instance.isProduction()).toBeFalsy();
        expect(instance.imageUrl()).toEqual("/data/images");
        expect(instance.imageDomain()).toEqual("");

        expect(instance.cardUrl() !== "").toBeTruthy();

        expect(instance.createContentSecurityPolicyMegaAdditionals() !== "").toBeTruthy();
        expect(instance.createContentSecurityPolicySelfOnly() !== "").toBeTruthy();
    });

    it('loadFromJson', () => {

        const data = {
            "image_path" : "https://test.com/img/cards",
            "cardsUrl" : "https://test.com/data/cards"
        };
        const instance = Configuration;
        instance.loadFromJson(data);

        expect(instance.port()).toEqual(8080);
        expect(instance.maxRooms()).toEqual(10);
        expect(instance.maxPlayersPerRoom()).toEqual(10);
        expect(instance.isProduction()).toBeFalsy();
        expect(instance.imageUrl()).toEqual(data.image_path);
        expect(instance.imageDomain()).toEqual("https://test.com");

        expect(instance.createContentSecurityPolicyMegaAdditionals() !== "").toBeTruthy();
        expect(instance.createContentSecurityPolicySelfOnly() !== "").toBeTruthy();
    });
});



    
