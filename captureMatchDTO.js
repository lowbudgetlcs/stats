require('dotenv').config();
const axios = require('axios');
const { Logger } = require('./helpers/Logging');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const projectId = process.env.PROJECT_ID;
const logger = new Logger(projectId, 'matchDTO');
const targetURLs = {
    TEST: process.env.TEST_ID,
    ECONOMY: process.env.ECONOMY_ID,
    COMMERCIAL: process.env.COMMERCIAL_ID,
    FINANCIAL: process.env.FINANCIAL_ID,
    EXECUTIVE: process.env.EXECUTIVE_ID

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
    const matchDTO = await getMatchV5(client, gameId);
    if (!participants) {
        logger.write({ severity: 'ERROR' }, 'Missing participant data');
        return;
    }
    const players = await participantDTOHandler(matchDTO);
    const destination = targetURLs[target];
    await appendValues(destination, 'RAW', players);
};

async function getMatchV5(client, gameId) {
    try {
        const matchV5Response = await client.get(`/lol/match/v5/matches/NA1_${gameId}`);
        logger.write({ severity: 'INFO' }, `Recieved ${matchV5Response.status} from match-v5 endpoint`);
        const matchDTO = matchV5Response.data;
        return matchDTO;
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
async function participantDTOHandler(matchDTO) {
    const tcode = matchDTO.info.tournamentCode;
    const participants = matchDTO.info.participants;
    logger.write({ severity: 'INFO' }, 'Participant data prep started');
    const playerData = [];
    for (const participant of participants) {
        try {
            const fields = ((
                { summonerName:name, championName: champion, kills, deaths, assists, neutralMinionsKilled: laneMinions,
                    totalMinionsKilled: jungleMinions, champLevel: level, goldEarned: gold, visionScore,
                    totalDamageDealtToChampions: totalDamageToChamps, totalHealsOnTeammates: totalHealing,
                    totalDamageShieldedOnTeammates: totalShielding, totalDamageTaken: damageTaken,
                    damageSelfMitigated: damageMitigated, damageDealtToBuildings: totalDamageToTurrets,
                    longestTimeSpentLiving: longestLife, doubleKills, tripleKills, quadraKills, pentaKills,
                    timePlayed: gameLength, win },
            ) => ({ name, champion, kills, deaths, assists, laneMinions, jungleMinions, level, gold, visionScore,
                totalDamageToChamps, totalHealing, totalShielding, damageTaken, damageMitigated, totalDamageToTurrets,
                longestLife, doubleKills, tripleKills, quadraKills, pentaKills, gameLength, win }))(participant);
            fields.creepScore = fields.laneMinions + fields.jungleMinions;
            fields.games = 1;
            fields.tcode = tcode;
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
    // Append player data to player sheet
    const sheetName = 'RAW STATS!A1';
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
