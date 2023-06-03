
const g_pCardList = new CardList({}, [], true, true);

const getImageUrlByCode = function(code)
{
    return g_pCardList.getImage(code);        
};