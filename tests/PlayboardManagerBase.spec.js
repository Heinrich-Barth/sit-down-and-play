const PlayboardManagerBase = require("../game-management/PlayboardManagerBase");



const pInstance = new PlayboardManagerBase({
    trigger : function(_sId, _obj)
    {
    /* not needed */
    }
});


describe('Test Default Value', () => {
    
    it('triggerEventSetupNewGame', () => {

        let _val = false;

        const ppInstance = new PlayboardManagerBase({
            trigger : function(sId, obj)
            {
                expect(sId).toEqual("setup-new-game");
                expect(obj).toEqual({});
                _val = true;
            }
        });

        ppInstance.triggerEventSetupNewGame();
        expect(_val).toEqual(true);
    });

    it('getEventManager()', () => expect(pInstance.getEventManager()).toBeDefined());
    it('GetData()', () => expect(pInstance.GetData()).toBeDefined());

    it('Save()', () => {
        expect(pInstance.Save().counter).toEqual(0);
        pInstance._counter++;
        expect(pInstance.Save().counter).toEqual(1);
    });
    it('Restore()', () => {
        pInstance._counter = 100;
        pInstance.Restore({counter : 1});
        expect(pInstance._counter).toEqual(1);
    });
    it('obtainUniqueCompanyId()', () => {
        pInstance._counter = 100;
        expect(pInstance.obtainUniqueCompanyId()).toEqual("company_101");
    });

    it('reset()', () => {
        pInstance._counter = 100;
        pInstance.data = "hallo";

        pInstance.reset();

        expect(pInstance._counter).toEqual(0);
        expect(pInstance.data).toEqual({});
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
