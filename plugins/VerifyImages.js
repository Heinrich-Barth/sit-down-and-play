const fs = require("fs");
const path = require("path");
const Logger = require("../Logger");

const getImageList = function(cards)
{
    const list = [];
    for (let key in cards)
    {
        const card = cards[key];
        if (card.image?.startsWith("/"))
            list.push(card.image);
        if (card.ImageNameErrataDC?.startsWith("/"))
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
        if (stat?.isFile()) 
            readFolder(file, listResult);
        else 
            listResult.push(file.replace(__dirname, ""));
    });
}

const isFile = function(file)
{
    try
    {
        const uri = path.resolve(__dirname + "/../public" + file);
        return fs.statSync(uri)?.isFile();
    }
    catch (errIgnore)
    {
        /* file not found */
    }

    return false;
}

const saveFile = function(data, file)
{
    try
    {
        fs.writeFileSync(file, data);
        return true;
    }
    catch (errIgnore)
    {

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
    {
        Logger.info("\t-- all images available");
        return;
    }

    if (saveFile(JSON.stringify(notFound), "./data-local/not-found.json"))
        Logger.warn("\t-- some images are missing. Please check " + "./data-local/not-found.json");
    else
        Logger.warn("\t-- some images are missing:\n" + notFound.join("\n"));
}
