
exports.identifyQuests = function(jsonCards)
{
    let missingSide = [];
    let images_to_code = { };
    let code_to_images = { };

    let list = {};
    let card;

    for (card of jsonCards) 
    {
        if (card.Race !== undefined && card.Race.startsWith("Quest-Side-"))
        {
            list[card.code] = "";
            images_to_code[card.ImageName] = card.code;
            code_to_images[card.code] = card.ImageName;
        }
    }   

    let nQuests = 0;
    let _image, _flipCode;
    for (let _code in list) 
    {
        if (code_to_images[_code].startsWith("flip-"))
        {
            _image = code_to_images[_code].replace("flip-", "");
            _flipCode = images_to_code[_image];
        }
        else
        {
            _image = code_to_images[_code];
            _flipCode = images_to_code["flip-" + _image];
        }

        if (_flipCode === undefined || _flipCode === "")
            missingSide.push(_code);

        list[_code] = _flipCode;
        nQuests++;
    }

    const nSize = missingSide.length;

    console.log("\t- Quests identified: " + (nQuests - nSize));
    for (let i = 0; i < nSize; i++)
    {
        delete list[missingSide[i]];
        console.log("\t- removing missing quest " + missingSide[i] + " from quest list.");
    }

    console.log("\t- missing quest removed: " + nSize);
    return list;
};