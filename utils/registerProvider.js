require('dotenv').config();
const axios = require('axios').create({
    baseURL: 'https://americas.api.riotgames.com/',
    headers: {
        'X-Riot-Token': process.env.TOKEN,
        'Content-Type': 'application/json',
    },
});

const body = {
    'region': 'NA',
    'url': 'https://us-central1-lblcs-389419.cloudfunctions.net/captureMatchDTO',
};
const url = 'lol/tournament/v4/providers';

(async () => {
    try {
        const res = await axios.post(url, {
            data: body,
        });
        console.log(`Recieved response ${res.status} with body ${res.data}`);
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
});
