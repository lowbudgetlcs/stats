exports.captureMatchDTO = (req, res) => {
    require('dotenv').config();
    const targetURLs = {
        ECONOMY: process.env.ECONOMY_URL,
    };
    const axios = require('axios');
    const client = axios.create({
        baseURL: 'https://americas.api.riotgames.com',
        headers: {
            'X-Riot-Token': process.env.TOKEN,
            'Content-Type': 'application/json',
        },
    });
    console.log('Recieved matchDTO from Riot.');
    console.log(req.body)
    const body = req.body;
    const gameId = body.gameId;
    const target = body.metaData;
    if (gameId && target) {
        // Acknowledge payload delivery
        res.status(200).send();
        (async () => {
            const resRiot = await client.get(`/lol/match/v5/matches/NA1_${gameId}`);
            console.log(`Recieved ${resRiot.status} from match-v5 endpoint`);
            console.log(resRiot.data);
            const participants = resRiot.data.info.participants;
            const players = await participantDTOHandler(participants, axios);
            console.log(players);
            // Send data to google script for collection
            const resGoogle = await client.post(targetURLs[target],
                {
                    'players': players,
                });
            console.log(`Recieved ${resGoogle.status} from spreadsheet script`);
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
async function participantDTOHandler(participants, axios) {
    const client = axios.create({
        baseURL: 'https://na1.api.riotgames.com',
        headers: {
            'X-Riot-Token': process.env.TOKEN,
            'Content-Type': 'application/json',
        },
    });
    const playerDTO = [];
    for (const participant of participants) {
        const data = {};
        try {
            // Replace puuid with summoner name
            const res = await client.get(`/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`);
            const name = res.data.name;
            data.name = name;
            console.log(data);
        }
        catch (e) {
            console.log(e);
        }
        // Extract relevant data
        data.kills = participant.kills;
        data.deaths = participant.deaths;
        data.assists = participant.assists;
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