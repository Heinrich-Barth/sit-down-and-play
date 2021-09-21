const CookiePreferences = require("../cookiepreferences");

const pCookiePreferences = new CookiePreferences("game");
pCookiePreferences.addPreference("background", "bg-game2");

describe('Test Default Value', () => {
    
    it('getCookieValue', () => {
      expect(pCookiePreferences.getCookieValue(undefined, "background", "x")).toEqual("x");
      expect(pCookiePreferences.getCookieValue({ "gametest": "hallo" }, "test", "x")).toEqual("hallo");
    });

    it('getValue', () => {
        expect(pCookiePreferences.getValue(undefined, "background")).toEqual("bg-game2");
        expect(pCookiePreferences.getValue({ "gametest": "hallo" }, "background")).toEqual("bg-game2");
        expect(pCookiePreferences.getValue({ "gamebackground": "hallo" }, "background")).toEqual("hallo");
    });

    it('isAvailable', () => {
        expect(pCookiePreferences.isAvailable("background")).toEqual(true);
        expect(pCookiePreferences.isAvailable("background2")).toEqual(false);
    });

    it('get', () => {
        let data = pCookiePreferences.get({});
        expect(data.background).toEqual("bg-game2");
    });
});
