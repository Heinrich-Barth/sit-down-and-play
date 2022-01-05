const Personalisation = require("../Personalisation");


describe('Personalisation', () => {
    
    it('getDices()', () => {
        
        let list = Personalisation.getDices();
        expect(list.length).toEqual(15);
    });
});