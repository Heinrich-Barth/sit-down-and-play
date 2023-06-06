const fs = require("fs");
const path = require("path");

const getImageList = function(cards)
{
    const list = [];
    for (let key in cards)
    {
        const card = cards[key];
        if (card.image && card.image.startsWith("/"))
            list.push(card.image);
        if (card.ImageNameErrataDC && card.ImageNameErrataDC.startsWith("/"))
            list.push(card.ImageNameErrataDC);
    }

    return list;
}

const readFolder = function(dir, listResult)
{
    const list = fs.readdirSync(dir);
    list.forEach(function(file) 
    {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isFile()) { 
            readFolder(file, listResult);
        } else { 
            listResult.push(file.replace(__dirname, ""));
        }
    });
}

const isFile = function(file)
{
    try
    {
        const uri = path.resolve(__dirname + "/../public" + file);
        const stat = fs.statSync(uri);
        return stat && stat.isFile();
    }
    catch (err)
    {
        console.warn(err.message);
    }

    return false;
}

module.exports.validateImages = function(cards)
{
    const candidates = getImageList(cards);
    let notFound = [];

    for (let image of candidates)
    {
        if (!isFile(image.replace("/data/", "/")))
            notFound.push(image);
    }

    if (notFound.length === 0)
        console.info("\t-- all images available");
    else
        console.warn("\t-- some images are missing:\n" + notFound.join("\n"));
}
