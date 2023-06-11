require('dotenv').config();
const targetURLs = {
    ECONOMY: process.env.ECONOMY_URL
};
const axios = require('axios').create({
    baseURL: 'https://americas.api.riotgames.com/',
    headers: {
        'X-Riot-Token': process.env.TOKEN,
        'Content-Type': 'application/json',
    },
});

exports.captureMatchDTO = (req, res) => {
    console.log(req.body);
    const body = req.body;
    const gameId = body.gameId;
    const target = body.metaData;
    if (gameId && target) {
        // Acknowledge payload delivery
        res.status(200).send();
        (async () => {
            const resRiot = await axios.get(`/lol/match/v5/matches/NA1_${gameId}`);
            console.log(resRiot.data);
            const participants = resRiot.data.info.participants;
            const players = participantDTOHandler(participants);
            // Send data to google script for collection
            const resGoogle = await axios.post(targetURLs[target],
                {
                    'players': players,
                });
            console.log(resGoogle.status);
        })();
    }
    else {
        // Tell riot i fucked up
        res.status(500).send();
    }
};

/**
 *
 * @param {List of participant data from Riot server call} participants
 * @returns A pruned list of participant data that can be used for stat collection
 */
function participantDTOHandler(participants) {
    const playerDTO = [];
    for (const participant of participants) {
        console.log(participant);
        const data = {};
        data.id = participant.puuid;
        data.kills = participant.kills;
        data.assists = participant.assists;
        data.deaths = participant.deaths;
        data.kda = participant.challenges.kda;
        data.level = participant.champLevel;
        data.championName = participant.championName;
        data.transform = participant.Transform;
        data.firstBlood = participant.firstBloodKill;
        data.firstTower = participant.firstTowerKill;
        data.gold = participant.goldEarned;
        data.visionScore = participant.visionScore;
        playerDTO.push(data);
    }
    return playerDTO;
}