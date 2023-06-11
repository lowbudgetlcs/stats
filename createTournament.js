const fs = require('fs');
require('dotenv').config();
providerId = process.env.PROVIDERID;

const flag = (process.argv.indexOf('--name') > -1);

let name;
if (flag && process.argv.length == 4) {
    name = process.argv[process.argv.indexOf('--name') + 1];
}
else {
    console.log('Usage: $node createTournament --name <name>');
    process.exit(-1);
}
const body = {
    'name': name,
    'providerId': providerId,
};

async () => {
    const res = await fetch('https://americas.api.riotgames.com/lol/tournament/v4/tournaments', {
        method: 'POST',
        headers: {
            'X-Riot-Token': process.env.TOKEN,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await res.body;
    const tournamentId = data.content;
    const obj = {};
    obj[name] = tournamentId;
    fs.appendFile('tournaments.json', JSON.stringify(obj), (err) => {
        if (err) throw err;
        console.log('Saved new tournament id');
    });

};