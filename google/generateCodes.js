const payload = {
  "mapType": "SUMMONERS_RIFT",
  "pickType": "TOURNAMENT_DRAFT",
  "spectatorType": "ALL",
  "teamSize": 5
  };

const stub = ["NA04c3f-e5332b26-b314-47fc-aa32-b156457af808", "NA04c3f-8f805944-5768-4606-a6b3-57aff0261d9b", "NA04c3f-46a85d87-c1f2-4e3b-a5c6-9f9eef6bfcdc", "NA04c3f-97a501f0-1ca9-4c14-af75-d4f82e0d211d", "NA04c3f-c105e060-6a6c-4ce0-b1a3-41c0853462b5", "NA04c3f-94f5badb-baaa-4b72-95e7-e7957320b07f", "NA04c3f-502dcfd2-4213-471b-b258-8ab3bf9497b1", "NA04c3f-04a7e0ae-ec09-4e02-9c59-1c28ee4cc56d"];

function createCodes() {
  // Config info
  const divisions = 2;
  const games = 4;
  const sheetBuffer = 6;
  const id = PropertiesService.getScriptProperties().getProperty("T_ID");
  // POST to Riot to generate games*divisions tournament codes
  const url = `https://americas.api.riotgames.com/lol/tournament/v4/codes?count=${games*divisions}&tournamentId=${id}`;
  const options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'X-Riot-Token': PropertiesService.getScriptProperties().getProperty("TOKEN"),
    },
    'payload': JSON.stringify(payload),
  };
  //const response = UrlFetchApp.fetch(url, options);
  // Clean response codes
  //const codes = response.getContentText().replace(/[\[\]\"]/g).split(",");
  const codes = stub;
  // Write codes to google sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Schedule");
  const offset = parseInt(PropertiesService.getScriptProperties().getProperty("OFFSET"), 10);
  try {
  const range1 = `G${4+offset}:G${7+offset}`;
  const range2 = `O${4+offset}:O${7+offset}`;
  // Build data objects- NOTE: must be a column vector (2-d array)
  const econA = [];
  codes.slice(0, games).forEach((val, i) => {
    econA[i] = [val];
  });
  const econB = [];
  codes.slice(games).forEach((val, i) => {
    econB[i] = [val];
  });    
  // Add tournament codes to sheet
  sheet.getRange(range1).setNotes(econA);
  sheet.getRange(range2).setNotes(econB);
  // Update sheet offset
  PropertiesService.getScriptProperties().setProperty("OFFSET", offset + sheetBuffer);
  } catch(e){
    console.log(e);
  }
}

function resetState(){
  PropertiesService.getScriptProperties().setProperty("OFFSET", 0);
  console.log(`Offset set to ${PropertiesService.getScriptProperties().getProperty("OFFSET")}`);
}