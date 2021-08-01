
let g_Agents = [];

exports.createAgentList = function (jsonCards)
{
    g_Agents = [];

    for (var card of jsonCards) 
    {
        if (card["type"] === "Character" && card["Secondary"] === "Agent") 
            g_Agents.push(card.code);
    }
};

exports.getAgents = () => g_Agents;
