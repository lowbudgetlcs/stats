require("dotenv").config();

const body = {
    "region": "NA",
    "url": "https://us-central1-lblcs-389419.cloudfunctions.net/captureMatchDTO"
  };

  const res = await fetch("https://americas.api.riotgames.com/lol/tournament/v4/providers", {
    method: 'POST',
    headers: {
        "X-Riot-Token": process.env.TOKEN,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(msg),
});

console.log(res);
