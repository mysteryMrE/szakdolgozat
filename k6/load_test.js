import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";
import exec from "k6/execution";
import { Counter, Trend } from "k6/metrics";

const BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";

const TOTAL_DURATION_SEC = 300;

const RAMP_UP_SEC = Math.floor(TOTAL_DURATION_SEC * 0.1);
const RAMP_DOWN_SEC = Math.floor(TOTAL_DURATION_SEC * 0.1);
const STEADY_SEC = TOTAL_DURATION_SEC - RAMP_UP_SEC - RAMP_DOWN_SEC;

const TEST_DURATION = `${TOTAL_DURATION_SEC}s`;

const DB_START_VUS = 5;
const DB_PEAK_VUS = 20;
const TRAINING_VUS = 2;
const WS_TARGET = 50;
const LOGIN_RATE_PER_SEC = 5;

const TRAIN_EPOCHS = 200;
const NO_TRAIN_USERS = 9900;
const LOGGING_USERS = 5000;
const TRAINING_USERS = 100;
// must be the id in the database of admin user
const BACKPROP_PLAYER_ID = "18-12-9";
const PASSWORD = "password123";

const loginFailures = new Counter("login_failures");
const loginSuccesses = new Counter("login_successes");
const dbFailures = new Counter("db_failures");
const dbRequestsCount = new Counter("db_requests_count");
const wsFailures = new Counter("ws_failures");
const wsGamesDone = new Counter("ws_games_done");
const wsGameStarted = new Counter("ws_games_started");
const wsClosedByGameOver = new Counter("ws_closed_by_game_over");
const wsClosedByTimeout = new Counter("ws_closed_by_timeout");
const wsGameDurationMs = new Trend("ws_game_duration_ms", true);
const trainAttempts = new Counter("train_attempts");
const trainStarted = new Counter("train_started");
const trainQuotaBlocked = new Counter("train_quota_blocked");
const trainServerBusy = new Counter("train_server_busy");
const trainErrors = new Counter("train_errors");
const trainStatusDone = new Counter("train_status_done");
const trainStatusError = new Counter("train_status_error");
const trainStatusPollFail = new Counter("train_status_poll_fail");
const trainStatusTimeout = new Counter("train_status_timeout");

const wsStages = [
  { duration: `${RAMP_UP_SEC}s`, target: WS_TARGET },
  { duration: `${STEADY_SEC}s`, target: WS_TARGET },
  { duration: `${RAMP_DOWN_SEC}s`, target: 0 },
];

const dbStages = [
  { duration: `${RAMP_UP_SEC}s`, target: DB_PEAK_VUS },
  { duration: `${STEADY_SEC}s`, target: DB_PEAK_VUS },
  { duration: `${RAMP_DOWN_SEC}s`, target: 0 },
];

export const options = {
  noConnectionReuse: true,
  scenarios: {
    constant_logins: {
      executor: "constant-arrival-rate",
      rate: LOGIN_RATE_PER_SEC,
      timeUnit: "1s",
      duration: TEST_DURATION,
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: "justLogin",
    },
    auth_and_db: {
      executor: "ramping-vus",
      exec: "authDb",
      startVUs: DB_START_VUS,
      stages: dbStages,
      gracefulStop: "10s",
    },
    training_background: {
      executor: "constant-vus",
      exec: "trainingBackground",
      vus: TRAINING_VUS,
      duration: TEST_DURATION,
      gracefulStop: "10s",
    },
    ws_minimax_ramp: {
      executor: "ramping-vus",
      exec: "wsGame",
      startVUs: 0,
      stages: wsStages,
      gracefulStop: "20s",
    },
  },
  thresholds: {
    "http_req_duration{type:auth}": ["p(95)<1000"],
    "http_req_duration{type:database}": ["p(95)<700"],
    "http_req_duration{type:ai_jobs}": ["p(95)<1000"],
    login_failures: ["count<10"],
    db_failures: ["count<10"],
  },
};

function loginUser(userId) {
  return http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ username: `user_${userId}`, password: PASSWORD }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { type: "auth" },
    },
  );
}

function authHeaders(token, tagType = "database") {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    tags: { type: tagType },
  };
}

export function justLogin() {
  const idx = Math.floor(Math.random() * LOGGING_USERS);
  const loginRes = loginUser(idx);
  if (loginRes.status === 200) {
    loginSuccesses.add(1);
  } else {
    loginFailures.add(1);
  }
}

let myDbToken = null;
let myDbNetworkName = null;

export function authDb() {
  if (!myDbToken) {
    const idx =
      LOGGING_USERS +
      ((exec.vu.idInTest - 1) % (NO_TRAIN_USERS - LOGGING_USERS));
    const loginRes = loginUser(idx);

    if (loginRes.status !== 200) {
      loginFailures.add(1);
      sleep(1);
      return;
    }

    myDbToken = loginRes.json("tokens.accessToken");
    myDbNetworkName = `limit_${idx}_net`;
    loginSuccesses.add(1);
  }

  const params = authHeaders(myDbToken, "database");

  let response = http.get(`${BASE_URL}/networks/list_networks`, params);
  dbRequestsCount.add(1);

  let networks = [];
  try {
    networks = response.json() || [];
  } catch (error) {
    networks = [];
  }

  if (networks.length === 0) {
    response = http.post(
      `${BASE_URL}/networks/create_network`,
      JSON.stringify({ name: myDbNetworkName }),
      params,
    );
    dbRequestsCount.add(1);
  } else if (networks.length > 0 && networks[0].id) {
    const netId = networks[0].id;
    const iterationInScenario = exec.vu.iterationInScenario;
    if (iterationInScenario % 3 === 0) {
      response = http.get(`${BASE_URL}/networks/${netId}`, params);
      dbRequestsCount.add(1);
    } else if (iterationInScenario % 3 === 1) {
      response = http.put(
        `${BASE_URL}/networks/${netId}`,
        JSON.stringify({ name: `${myDbNetworkName}_${iterationInScenario}` }),
        params,
      );
      dbRequestsCount.add(1);
    } else {
      response = http.del(`${BASE_URL}/networks/${netId}`, null, params);
      dbRequestsCount.add(1);
    }
  }

  const ok = check(response, {
    "db op status ok": (response) => [200, 201, 404].includes(response.status),
  });
  if (!ok) dbFailures.add(1);

  sleep(0.1);
}

let myTrainToken = null;
let myTrainNetworkId = null;
let myTrainUserIdx = null;

export function trainingBackground() {
  const rotateTime = Math.floor(exec.vu.iterationInScenario / 10);
  const idx =
    NO_TRAIN_USERS + ((rotateTime + exec.vu.idInTest - 1) % TRAINING_USERS);

  if (!myTrainToken || myTrainUserIdx !== idx) {
    const loginRes = loginUser(idx);

    if (loginRes.status !== 200) {
      loginFailures.add(1);
      sleep(1);
      return;
    }

    myTrainToken = loginRes.json("tokens.accessToken");
    const userId = loginRes.json("user.id");
    myTrainNetworkId = `user_${userId}_net_0`;
    myTrainUserIdx = idx;
    loginSuccesses.add(1);
  }

  const res = http.post(
    `${BASE_URL}/jobs/train`,
    JSON.stringify({
      networkId: myTrainNetworkId,
      method: "backprop",
      params: { epochs: TRAIN_EPOCHS, learning_rate: 10 },
    }),
    authHeaders(myTrainToken, "ai_jobs"),
  );

  trainAttempts.add(1);

  if (res.status === 200) {
    trainStarted.add(1);
    const jobId = res.json("jobId");
    if (jobId) {
      let finished = false;
      for (let i = 0; i < 20; i++) {
        sleep(2);
        const statusRes = http.get(
          `${BASE_URL}/jobs/train/${jobId}/status`,
          authHeaders(myTrainToken, "ai_jobs"),
        );

        if (statusRes.status === 200) {
          const status = statusRes.json("status");
          if (status === "done") {
            trainStatusDone.add(1);
            finished = true;
            break;
          }
          if (status === "error") {
            trainStatusError.add(1);
            finished = true;
            break;
          }
        } else {
          trainStatusPollFail.add(1);
          break;
        }
      }
      if (!finished) trainStatusTimeout.add(1);
    }
  } else if (res.status === 409) trainQuotaBlocked.add(1);
  else if (res.status === 503) trainServerBusy.add(1);
  else trainErrors.add(1);

  sleep(1);
}

export function wsGame() {
  const guestId = `guest_${exec.vu.idInTest}_${exec.vu.iterationInScenario}`;
  const url = `${WS_BASE_URL}/game/${guestId}`;

  const conf = {
    player1: { id: "x", type: "random", name: "Mini" },
    player2: { id: BACKPROP_PLAYER_ID, type: "random", name: "Bot" },
    player_delay_ms: 10,
    round_delay_ms: 10,
    auto: true,
    rounds: 10,
  };

  const res = ws.connect(url, { tags: { name: "ws_game" } }, (socket) => {
    const startedAt = Date.now();
    let closed = false;
    let closeReason = "timeout";

    socket.on("open", () => {
      socket.send(JSON.stringify({ type: "new", config: conf }));
      wsGameStarted.add(1);
    });

    socket.on("message", (msg) => {
      if (typeof msg === "string" && msg.includes("game_over") && !closed) {
        wsGamesDone.add(1);
        closeReason = "game_over";
        closed = true;
        socket.close();
      }
    });

    socket.on("close", () => {
      wsGameDurationMs.add(Date.now() - startedAt);
      if (closeReason === "game_over") wsClosedByGameOver.add(1);
      else wsClosedByTimeout.add(1);
    });

    socket.setTimeout(() => {
      if (!closed) {
        closeReason = "timeout";
        closed = true;
        socket.close();
      }
    }, 60000);
  });

  const ok = check(res, { "ws status 101": (r) => r && r.status === 101 });
  if (!ok) wsFailures.add(1);
  sleep(0.2);
}
