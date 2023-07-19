require('dotenv').config();

const axios = require('axios');

const { Logging } = require('@google-cloud/logging');
const projectId = process.env.projectId;
const logging = new Logging({ projectId });
const logName = 'matchDTO';
const log = logging.log(logName);
let entry;

const targetURLs = {
    TEST: process.env.TEST_SHEET_ID,
};

exports.captureMatchDTO = async (req, res) => {
    entry = log.entry(`Recieved match data at ${new Date().toTimeString()}`);
    log.info(entry);
    res.status(200).send();
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

    const gameId = req.body.gameId;
    const target = req.body.metaData;
    if (!(gameId && target)) {
        entry = log.entry('Missing gameId or target');
        log.warning(entry);
        return;
    }
    const participants = await getMatchV5(client, gameId);
    if (!participants) {
        entry = log.entry('Missing participant data');
        log.error(entry);
        return;
    }
    // Replace puuid's with player names
    const players = await participantDTOHandler(participants);
    // Append data to stat sheet
    const resGoogle = await client.post(targetURLs[target],
        {
            'players': players,
        });
    entry = log.entry(`Recieved ${resGoogle.status} from ${target} endpoint`);
    log.info(entry);
};


async function getMatchV5(client, gameId) {
    try {
        const matchV5Response = await client.get(`/lol/match/v5/matches/NA1_${gameId}`);
        entry = log.entry(`Recieved ${matchV5Response.status} from match-v5 endpoint`);
        log.info(entry);
        const matchDTO = matchV5Response.data;
        return matchDTO.info.participants;
    }
    catch (e) {
        axiosError(e);
        return {};
    }
}

/**
 *
 * @param {List of participant data from Riot server call} participants
 * @returns A pruned list of participant data that can be used for stat collection
 */
async function participantDTOHandler(participants) {
    entry = log.entry(`Participant data prep started @${new Date().toTimeString()}`);
    log.info(entry);
    // New client for SUMMONER endpoint
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

    const playerData = [];
    for (const participant of participants) {
        const data = {};
        try {
            // Replace puuid with summoner name
            const res = await client.get(`/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`);
            entry = log.entry(`Recieved ${res.status} code from summoner endpoint`);
            log.info(entry);
            const name = res.data.name;
            data.name = name;
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
            playerData.push(data);
        }
        catch (e) {
            axiosError(e);
        }
    }
    return playerData;
}

async function appendValues(spreadsheetId, range, valueInputOption, _values){
    const {GoogleAuth} = require('google-auth-library');
  const {google} = require('googleapis');

  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  const service = google.sheets({version: 'v4', auth});
  let values = [
    [
      // Cell values ...
    ],
    // Additional rows ...
  ];
  const resource = {
    values,
  };
  try {
    const result = await service.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    });
    console.log(`${result.data.updates.updatedCells} cells appended.`);
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    throw err;
  }
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