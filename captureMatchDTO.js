require('dotenv').config();

const axios = require('axios');

const { Logging } = require('@google-cloud/logging');
const projectId = process.env.projectId;
const logging = new Logging({ projectId });
const logName = 'matchDTO';
const log = logging.log(logName);
let entry;

const targetURLs = {
    ECONOMY: process.env.ECONOMY_URL,
};

exports.captureMatchDTO = (req, res) => {
    entry = log.entry(`Recieved match data at ${new Date().toTimeString()}`);
    log.info(entry);

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
                entry = log.entry(`Recieved ${resRiot.status} from match-v5 endpoint`);
                log.info(entry);
                const participants = resRiot.data.info.participants;
                const players = await participantDTOHandler(participants);
                // Send data to google script for collection
                const resGoogle = await client.post(targetURLs[target],
                    {
                        'players': players,
                    });
                entry = log.entry(`Recieved ${resGoogle.status} from ${target} endpoint`);
                log.info(entry);
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
    entry = log.entry(`Participant data prep started @${new Date().toTimeString()}`);
    log.info(entry);
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
            entry = log.entry(`Recieved ${res.status} code from summoner endpoint`);
            log.info(entry);
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
        // Recieved error status
        entry = log.entry(`Recieved status code:: ${err.response.status}\nWith headers:: ${err.response.headers}\nRequest data:: ${err.response.data}\n`);
        log.error(entry);
    }
    else if (err.request) {
        // No response
        entry = log.entry(`No response recieved:: ${err.request}`);
        log.error(entry);

    }
    else {
        // Error setting up request
        entry = err.toJson();
        log.error(entry);
    }
}