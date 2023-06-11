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

try {
    const res = async () => await axios.post(url, {
        data: body,
    });
    console.log(`Recieved response ${res.status} with body ${res.data}`);
}
catch (e) {
    console.log(e);
}
