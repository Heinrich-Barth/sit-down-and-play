const fs = require("fs");
const path = require("path");

const readFolder = function(dir, listResult)
{
    const list = fs.readdirSync(dir);
    list.forEach(function(file) 
    {
        const _name = file;
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            readFolder(file, listResult);
        } else { 
            listResult.push(_name);
        }
    });
}

const getCardImageFileName = function(file)
{
    const pos = file === undefined ? -1 : file.lastIndexOf("/");
    return pos === -1 ? "" : file.substring(pos+1);
}

const cards = JSON.parse(fs.readFileSync(__dirname + "/../data-local/cards.json", "utf-8"));

test("all images available", () =>
{
    const obsolete = [];
    const listResult = [];
    const listActiveCards = [];
    readFolder(path.resolve(__dirname + "/../data-local/images"), listResult);
    expect(listResult.length).toBeGreaterThan(0);

    for (let card of cards)
    {
        const cardImage = card.ImageName.startsWith("/data/") ? getCardImageFileName(card.ImageName) : "";
        const cardImageDC = getCardImageFileName(card.ImageNameErrataDC);
        
        if (cardImage !== "" && !listActiveCards.includes(cardImage))
            listActiveCards.push(cardImage);
        if (cardImageDC !== "" && !listActiveCards.includes(cardImageDC))
            listActiveCards.push(cardImageDC);
    }

    expect(listActiveCards.length).toBeGreaterThan(0);

    for (let found of listResult)
    {
        if (!listActiveCards.includes(found))
            obsolete.push(found);
    }

    console.log(obsolete)
    expect(obsolete.length).toEqual(0);
});
