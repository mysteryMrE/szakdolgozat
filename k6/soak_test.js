import http from "k6/http";
import ws from "k6/ws";
import { sleep } from "k6";
import exec from "k6/execution";
import { Counter, Gauge } from "k6/metrics";

const BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";
const RENEW_ACCESS_MS = 600000; // 10 minutes, must be shorter than the backend access token TTL set in .env

const authFailures = new Counter("auth_failures");
const trainStartFailures = new Counter("train_start_failures");
const wsConnectFailures = new Counter("ws_connect_failures");
const trainAttempts = new Counter("train_attempts");
const trainStarted = new Counter("train_started");
const trainServerBusy = new Counter("train_server_busy");
const wsGameCompleted = new Counter("ws_game_completed");
const wsGameInterrupted = new Counter("ws_game_interrupted");
const trainQuotaBlocked = new Counter("train_quota_blocked");

const dbHealth = new Gauge("db_health");
const sysJobs = new Gauge("jobs");
const sysBots = new Gauge("bots");
const sysGames = new Gauge("games");
const sysWsActive = new Gauge("ws_active");
const sysWsUsers = new Gauge("ws_users");
const sysWsLocks = new Gauge("ws_locks");
const sysActiveJobs = new Gauge("active_jobs");

const MAX_USER_ID = 1000;
const TOTAL_VUS = 40;
const ITER_DIFF = Math.floor(MAX_USER_ID / TOTAL_VUS);

export const options = {
  vus: TOTAL_VUS,
  duration: "130m",
  thresholds: {
    ws_connect_failures: ["count<50"],
    auth_failures: ["rate<0.05"],
  },
  noConnectionReuse: true,
};

const vuTokens = {};
const vuLastLogin = {};

export default function () {
  const userIdx =
    ((exec.vu.idInTest - 1) * ITER_DIFF +
      (exec.vu.iterationInScenario % ITER_DIFF)) %
    MAX_USER_ID;
  const now = Date.now();

  let myToken = vuTokens[userIdx];
  let myLastLogin = vuLastLogin[userIdx] || 0;

  if (!myToken || now - myLastLogin > RENEW_ACCESS_MS) {
    const loginRes = http.post(
      `${BASE_URL}/users/login`,
      JSON.stringify({
        username: `user_${userIdx}`,
        password: "password123",
      }),
      { headers: { "Content-Type": "application/json" } },
    );

    if (loginRes.status !== 200) {
      authFailures.add(1);
      sleep(5);
      return;
    }

    myToken = loginRes.json("tokens.accessToken");
    vuTokens[userIdx] = myToken;
    vuLastLogin[userIdx] = now;
  }

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${myToken}`,
      "Content-Type": "application/json",
    },
  };

  if (exec.vu.idInTest <= 25) {
    playWebsocketGame(userIdx);
  } else if (exec.vu.idInTest <= 27) {
    runTraining(authHeaders);
  } else if (exec.vu.idInTest <= 39) {
    runCrud(authHeaders);
  } else {
    runSystemChecks();
  }

  sleep(0.5 + Math.random() * 5);
}

const conf = {
  player1: {
    id: "x",
    type: "minimax",
    name: "Mini",
  },
  player2: {
    id: "y",
    type: "random",
    name: "Randy",
  },
  player_delay_ms: 100,
  round_delay_ms: 100,
  auto: true,
  rounds: 100,
};

function playWebsocketGame(userIdx) {
  const isEarlyLeave = Math.random() < 0.8;
  const durationMs = isEarlyLeave ? Math.random() * 5000 + 2000 : 200000;
  const url_rotate = `${WS_BASE_URL}/game/guest_${userIdx}`;
  const url_unique = `${WS_BASE_URL}/game/guest_${userIdx}_${Date.now()}`;
  const url = Math.random() < 0.5 ? url_rotate : url_unique;
  const res = ws.connect(url, { tags: { name: "game_ws" } }, (socket) => {
    let closed = false;
    socket.on("open", () =>
      socket.send(JSON.stringify({ type: "new", config: conf })),
    );
    socket.on("message", (msg) => {
      if (typeof msg === "string" && msg.includes("game_over")) {
        wsGameCompleted.add(1);
        if (!closed) {
          closed = true;
          socket.close();
        }
      }
    });
    socket.setTimeout(() => {
      if (!closed) {
        closed = true;
        socket.close();
      }
    }, durationMs);
  });

  if (res && res.status === 101) {
    if (isEarlyLeave) wsGameInterrupted.add(1);
  } else {
    wsConnectFailures.add(1);
  }
}

function runTraining(authHeaders) {
  const resList = http.get(`${BASE_URL}/networks/list_networks`, authHeaders);
  if (resList.status !== 200) {
    trainStartFailures.add(1);
    return;
  }

  const nets = resList.json();
  if (!Array.isArray(nets) || nets.length === 0) {
    console.error(
      "No networks",
      " Response:",
      resList.body,
      "time:",
      new Date().toISOString(),
    );
    trainStartFailures.add(1);
    return;
  }

  trainAttempts.add(1);
  const res = http.post(
    `${BASE_URL}/jobs/train`,
    JSON.stringify({
      networkId: nets[0].id,
      method: "backprop",
      params: { epochs: 500 },
    }),
    authHeaders,
  );

  if (res.status === 409) {
    trainQuotaBlocked.add(1);
    sleep(5);
    return;
  } else if (res.status === 503) {
    trainServerBusy.add(1);
    sleep(5);
    return;
  } else if (res.status !== 200) {
    trainStartFailures.add(1);
    return;
  }
  trainStarted.add(1);

  const jobId = res.json("jobId");

  let finished = false;
  let retries = 0;
  const maxRetries = 90; // max 3 minutes of polling

  while (!finished && retries < maxRetries) {
    sleep(2);
    const statusRes = http.get(`${BASE_URL}/jobs/train/${jobId}/status`, {
      ...authHeaders,
      tags: { name: "train_status" },
    });

    if (statusRes.status === 200) {
      const status = statusRes.json("status");
      if (status === "done" || status === "error") {
        finished = true;
      }
    } else {
      finished = true;
    }
    retries++;
  }
}

function runCrud(authHeaders) {
  const nets =
    http.get(`${BASE_URL}/networks/list_networks`, authHeaders).json() || [];

  if (nets.length > 0 && Math.random() > 0.5) {
    http.put(
      `${BASE_URL}/networks/${nets[0].id}`,
      JSON.stringify({ name: `updated_${Date.now()}` }),
      { ...authHeaders, tags: { name: "update_network" } },
    );
  } else if (nets.length > 1) {
    http.del(`${BASE_URL}/networks/${nets[1].id}`, null, {
      ...authHeaders,
      tags: { name: "delete_network" },
    });
  } else {
    http.post(
      `${BASE_URL}/networks/create_network`,
      JSON.stringify({ name: `new_${Date.now()}` }),
      authHeaders,
    );
  }
}

function runSystemChecks() {
  const res = http.get(`${BASE_URL}/db_health`);

  const stats = http.get(`${BASE_URL}/stats`).json() || {};

  dbHealth.add(res.status === 200 ? 1 : 0);
  if (stats.jobs !== undefined) sysJobs.add(stats.jobs);
  if (stats.bots !== undefined) sysBots.add(stats.bots);
  if (stats.games !== undefined) sysGames.add(stats.games);
  if (stats["websocket active"] !== undefined)
    sysWsActive.add(stats["websocket active"]);
  if (stats["websocket users"] !== undefined)
    sysWsUsers.add(stats["websocket users"]);
  if (stats["websocket locks"] !== undefined)
    sysWsLocks.add(stats["websocket locks"]);
  if (stats.active_jobs !== undefined) sysActiveJobs.add(stats.active_jobs);
}
