require('dotenv').config();
const axios = require('axios');
const { Logger } = require('./helpers/Logging');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const projectId = process.env.PROJECT_ID;
const logger = new Logger(projectId, 'matchDTO');
const targetURLs = {
    TEST: process.env.TEST_ID,
};
// Receive Request, contains z
exports.captureMatchDTO = async (req, res) => {
    logger.write({ severity: 'INFO' }, 'Recieved match data');
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
        logger.write({ severity: 'WARNING' }, 'Missing gameId or target');
        return;
    }
    const participants = await getMatchV5(client, gameId);
    if (!participants) {
        logger.write({ severity: 'ERROR' }, 'Missing participant data');
        return;
    }
    const players = await participantDTOHandler(participants);
    const destination = targetURLs[target];
    await appendValues(destination, 'RAW', players);
};

async function getMatchV5(client, gameId) {
    try {
        const matchV5Response = await client.get(`/lol/match/v5/matches/NA1_${gameId}`);
        logger.write({ severity: 'INFO' }, `Recieved ${matchV5Response.status} from match-v5 endpoint`);
        const matchDTO = matchV5Response.data;
        return matchDTO.info.participants;
    }
    catch (e) {
        return {};
    }
}

/**
 *
 * @param {List of participant data from Riot server call} participants
 * @returns A pruned list of participant data that can be used for stat collection
 */
async function participantDTOHandler(participants) {
    logger.write({ severity: 'INFO' }, 'Participant data prep started');
    // New client for SUMMONER endpoint

    const playerData = [];
    for (const participant of participants) {
        try {
            const fields = ((
                { summonerName, championName, kills, deaths, assists, neutralMinionsKilled, totalMinionsKilled,
                    champLevel, goldEarned, visionScore, totalDamageDealtToChampions,
                    doubleKills, tripleKills, quadraKills, pentaKills, win },
            ) => ({
                summonerName, championName, kills, deaths, assists, neutralMinionsKilled, totalMinionsKilled,
                champLevel, goldEarned, visionScore, totalDamageDealtToChampions,
                doubleKills, tripleKills, quadraKills, pentaKills, win
            }))(participant);
            fields.creepScore = fields.neutralMinionsKilled + fields.totalMinionsKilled;
            const data = Object.values(fields);
            playerData.push(data);
        }
        catch (e) {
        }
    }
    return playerData;
}

async function appendValues(spreadsheetId, valueInputOption, values) {
    // Auth
    const resource = {
        values,
    };
    console.log(spreadsheetId);
    // Append player data to player sheet
    const sheetName = 'Player Stats!A1';
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const service = google.sheets({ version: 'v4', auth });
    const result = await service.spreadsheets.values.append({
        valueInputOption: valueInputOption,
        spreadsheetId: spreadsheetId,
        range: sheetName,
        requestBody: resource,
    });
    logger.write({ severity: 'INFO' }, `Appended data to ${spreadsheetId} endpoint`);
    return result;

}