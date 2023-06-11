require('dotenv').config();
const fs = require('fs');
const flag = (process.argv.indexOf('--name') > -1);

let name;
if (flag && process.argv.length == 4) {
    name = process.argv[process.argv.indexOf('--name') + 1];
}
else {
    console.log('Usage: $node createTournament --name <name>');
    process.exit(-1);
}

const url = 'https://americas.api.riotgames.com/lol/tournament/v4/tournaments';
const body = {
    'name': name,
    'providerId': process.env.PROVIDERID,
};

(async () => {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Riot-Token': process.env.TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        console.log(`Recieved status ${res.status}`);
        if (res.ok) {
            const tournamentId = await res.json();
            const tournaments = require('./tournaments.json');
            tournaments[name] = tournamentId;

            fs.writeFileSync('tournaments.json', JSON.stringify(tournaments), (err) => {
                if (err) throw err;
                console.log(`Saved new tournament id ${name} : ${tournamentId}`);
            });
        }
        else {
            console.log('Response not 200');
        }
    }
    catch (e) {
        console.log(e.code);
    }
})();