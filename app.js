const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
const convertPlayerDBObject = (eachItem) => {
  return {
    playerId: eachItem.player_id,
    playerName: eachItem.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      *
    FROM
      player_details;`;
  const getPlayersQueryResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayersQueryResponse.map((eachItem) => convertPlayerDBObject(eachItem))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `
    SELECT 
      *
    FROM
      player_details
    WHERE
      player_id = '${playerId}';`;
  const getPlayerIdResponse = await db.get(getPlayerByIdQuery);
  response.send(convertPlayerDBObject(getPlayerIdResponse));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatedPlayerNameQuery = `
    UPDATE 
      player_details
    SET
      player_name = '${playerName}'
    WHERE
      player_id = '${playerId}';`;
  const updatePlayerNameQueryResponse = await db.run(updatedPlayerNameQuery);
  response.send("Player Details Updated");
});

//API 4
const convertMatchDetailsObj = (eachObj) => {
  return {
    matchId: eachObj.match_id,
    match: eachObj.match,
    year: eachObj.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT 
      *
    FROM
      match_details
    WHERE
      match_id = '${matchId}';`;
  const getMatchDetailsQueryResponse = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsObj(getMatchDetailsQueryResponse));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `
    SELECT 
      *
    FROM
      player_match_score
    WHERE
      player_id = '${playerId}'`;

  const getMatchesOfPlayerResponse = await db.all(getMatchesOfPlayerQuery);
  const matchIdArray = getMatchesOfPlayerResponse.map((eachItem) => {
    return eachItem.match_id;
  });

  const matchDetailsQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id IN (${matchIdArray});`;
  const getMatchDetailsQueryResponse = await db.all(matchDetailsQuery);
  response.send(
    getMatchDetailsQueryResponse.map((eachObj) =>
      convertMatchDetailsObj(eachObj)
    )
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchDetails = `
    SELECT 
      *
    FROM
      player_match_score NATURAL JOIN player_details
    WHERE
      match_id = '${matchId}';`;
  const getPlayersOfMatchDetailsResponse = await db.all(
    getPlayersOfMatchDetails
  );
  response.send(
    getPlayersOfMatchDetailsResponse.map((eachObj) =>
      convertPlayerDBObject(eachObj)
    )
  );
});

//API 7
const playerStatusObj = (playerName, statusObj) => {
  return {
    playerId: statusObj.player_id,
    playerName: playerName,
    totalScore: statusObj.totalScore,
    totalFours: statusObj.totalFours,
    totalSixes: statusObj.totalSixes,
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT
      player_name
    FROM
      player_details
    WHERE
      player_id = '${playerId}';`;
  const getPlayerNameQueryResponse = await db.get(getPlayerNameQuery);
  const getPlayerDetailsQuery = `
    SELECT 
      player_id,
      sum(score) AS totalScore,
      sum(fours) AS totalFours,
      sum(sixes) AS totalSixes
    FROM
      player_match_score
    WHERE
      player_id = '${playerId}';`;
  const getPlayerDetailsQueryResponse = await db.get(getPlayerDetailsQuery);
  response.send(
    playerStatusObj(
      getPlayerNameQueryResponse.player_name,
      getPlayerDetailsQueryResponse
    )
  );
});

module.exports = app;
