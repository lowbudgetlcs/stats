require('dotenv').config();
const fs = require('fs/promises');
const axios = require('axios').create({
    baseURL: 'https://americas.api.riotgames.com/',
    headers: {
        'X-Riot-Token': process.env.TOKEN,
        'Content-Type': 'application/json',
    },
    validateStatus: (status) => {
        return status >= 200 && status <= 299;
    },
});
// Check if name arg exists and extracts it
const flag = (process.argv.indexOf('-n') > -1);
let name;
if (flag && process.argv.length == 4) {
    name = process.argv[process.argv.indexOf('-n') + 1];
}
else {
    console.log(`usage: ${process.argv[1]} createTournament -n name`);
    process.exit(-1);
}
const url = 'lol/tournament/v4/tournaments';
// API call with axios library
(async () => {
    try {
        const res = await axios.post(url,
            {
                'name': name,
                'providerId': process.env.PROVIDERID,
            });
        // log status and response body
        console.log(`Request ${res.request} yielded status:: ${res.status}\nheaders::\n${res.headers}\nbody::\n${res.data}`);
        if (res.status >= 200 && res.status <= 299) {
        // Write tournament ID to file
            const tournamentId = res.data;
            const tournaments = JSON.parse(JSON.stringify(require('./tournaments.json')));
            tournaments[name] = tournamentId;
            await fs.writeFile('tournaments.json', JSON.stringify(tournaments));
        }
        else {
            console.log(`Recieved code ${res.status}`);
        }
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
})();
