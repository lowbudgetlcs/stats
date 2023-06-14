require('dotenv').config();
const axios = require('axios');

const targetURLs = {
    ECONOMY: process.env.ECONOMY_URL,
};

exports.captureMatchDTO = (req, res) => {
    Console.log(`Recieved match data at ${new Date().toTimeString()} with ${req.body}`);
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
                Console.log(`Recieved ${resRiot.status} from match-v5 endpoint`);
                const participants = resRiot.data.info.participants;
                const players = await participantDTOHandler(participants);
                // Send data to google script for collection
                const resGoogle = await client.post(targetURLs[target],
                    {
                        'players': players,
                    });
                Console.log(`Recieved ${resGoogle.status} from ${target} endpoint`);
            })();
        }
        catch (e) {
            axiosError(e);
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
    Console.log('Began participant data preparation');
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
            Console.log(`Recieved ${res.status} code from summoner endpoint`);
            const name = res.data.name;
            data.name = name;
        }
        catch (e) {
            axiosError(e);
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

function axiosError(err) {
    if (err.response) {
        // Error code
        Console.log(`Recieved status code:: ${err.response.status}`);
        Console.log(`Request data:: ${err.response.data}`);
        Console.log(`With headers:: ${err.response.headers}`);
    }
    else if (err.request) {
        // No response
        Console.log(`No response recieved:: ${err.request}`);
    }
    else {
        // Error setting up request
        Console.log('Error', err.toJson());
    }
}