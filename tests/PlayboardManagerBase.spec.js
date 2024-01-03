const PlayboardManagerBase = require("../game-management/PlayboardManagerBase");



const pInstance = new PlayboardManagerBase({
    trigger : function(sId, obj)
    {

    }
});


describe('Test Default Value', () => {
    
    it('getEventManager()', () => expect(pInstance.getEventManager()).toBeDefined());
    it('GetData()', () => expect(pInstance.GetData()).toBeDefined());

    it('Save()', () => {
        expect(pInstance.Save().counter).toEqual(0);
        pInstance.obtainUniqueCompanyId();
        expect(pInstance.Save().counter).toEqual(1);
    });
    it('Restore()', () => {
        pInstance.Restore({counter : 1});
        expect(pInstance.Save().counter).toEqual(1);
    });
    it('obtainUniqueCompanyId()', () => {
        const parts = pInstance.obtainUniqueCompanyId().split("_");
        expect(parts.length).toEqual(2);
        expect(parts[0]).toEqual("company");
        expect(parseInt(parts[1])).toBeGreaterThan(0);
    });

    it("AssertString()", () => {

        expect(pInstance.AssertString(0)).toEqual("");
        expect(pInstance.AssertString({})).toEqual("");
        expect(pInstance.AssertString(null)).toEqual("");
        expect(pInstance.AssertString(undefined)).toEqual("");
        expect(pInstance.AssertString("hallo")).toEqual("hallo");
    });

    it("removeFromList()", () => {

        let list = ["hallo", "welt", "!"];
        pInstance.removeFromList("hhh", list);
        expect(list.length).toEqual(3);

        
        pInstance.removeFromList("welt", list);
        expect(list.length).toEqual(2);
        expect(list[0]).toEqual("hallo");
        expect(list[1]).toEqual("!");

        pInstance.removeFromList("!", list);
        expect(list.length).toEqual(1);
        expect(list[0]).toEqual("hallo");

        pInstance.removeFromList("hallo", list);
        expect(list.length).toEqual(0);
    });
    
});
