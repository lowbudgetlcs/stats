require('dotenv').config();
const targetURLs = {
    ECONOMY: process.env.ECONOMY_URL,
};
const axios = require('axios');

exports.captureMatchDTO = (req, res) => {
    Logger.log(`Recieved match data at ${new Date().toTimeString()} with ${req.body}`);
    const client = axios.create({
        baseURL: 'https://americas.api.riotgames.com',
        headers: {
            'X-Riot-Token': process.env.TOKEN,
            'Content-Type': 'application/json',
        },
        validateStatus: (status) => {
            return status >= 200 && status <= 299;
        },
    });
    const body = req.body;
    const gameId = body.gameId;
    const target = body.metaData;
    if (gameId && target) {
        // Acknowledge payload delivery
        res.status(200).send();
        try {
            (async () => {
                const resRiot = await client.get(`/lol/match/v5/matches/NA1_${gameId}`);
                Logger.log(`Recieved ${resRiot.status} from match-v5 endpoint`);
                const participants = resRiot.data.info.participants;
                const players = await participantDTOHandler(participants);
                // Send data to google script for collection
                const resGoogle = await client.post(targetURLs[target],
                    {
                        'players': players,
                    });
                Logger.log(`Recieved ${resGoogle.status} from ${target} endpoint`);
            })();
        }
        catch (err) {
            if (err.response) {
            // Error code
                Logger.log(`Recieved status code:: ${err.response.status}`);
                Logger.log(`Request data:: ${err.response.data}`);
                Logger.log(`With headers:: ${err.response.headers}`);
            }
            else if (err.request) {
            // No response
                Logger.log(`No response recieved:: ${err.request}`);
            }
            else {
            // Error setting up request
                Logger.log('Error', err.toJson());
            }
        }
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
async function participantDTOHandler(participants) {
    Logger.log('Began participany data preparation');
    const client = axios.create({
        baseURL: 'https://na1.api.riotgames.com',
        headers: {
            'X-Riot-Token': process.env.TOKEN,
            'Content-Type': 'application/json',
        },
        validateStatus: (status) => {
            return status >= 200 && status <= 299;
        },
    });
    const playerDTO = [];
    for (const participant of participants) {
        const data = {};
        try {
            // Replace puuid with summoner name
            const res = await client.get(`/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`);
            Logger.log(`Recieved ${res.status} code from summoner endpoint`);
            const name = res.data.name;
            data.name = name;
        }
        catch (e) {
            if (err.response) {
                // Error code
                    Logger.log(`Recieved status code:: ${err.response.status}`);
                    Logger.log(`Request data:: ${err.response.data}`);
                    Logger.log(`With headers:: ${err.response.headers}`);
                }
                else if (err.request) {
                // No response
                    Logger.log(`No response recieved:: ${err.request}`);
                }
                else {
                // Error setting up request
                    Logger.log('Error', err.toJson());
                }
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