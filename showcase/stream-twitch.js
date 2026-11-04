// Live Twitch events for the stream scenes, from inside OBS.
//
// The scene URL carries ?twitch=<client id> and, once, #rt=<refresh token>
// from a device-code sign-in. One browser source holds a Web Lock and runs
// the feed: it refreshes the token (Twitch rotates it on every use, so only
// one source may), keeps an EventSub WebSocket open and tells every source
// over a BroadcastChannel. When it closes, another source takes the lock.
// Tokens live in this origin's localStorage, which OBS keeps across restarts.

const AUTH = "https://id.twitch.tv/oauth2";
const API = "https://api.twitch.tv/helix";
const WS = "wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30";
const KEY = "sd-twitch";
const channel = new BroadcastChannel("sd-twitch");

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
};
const save = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{ clientId: string, seed?: string, onEvent: (event: object) => void }} options
 *   onEvent gets { type: "alert", alert } for a live event, { type: "latest", kind, name }
 *   and { type: "goal", kind, value } at start, and { type: "status", ok, note }.
 */
export function startTwitch({ clientId, seed, onEvent }) {
  channel.addEventListener("message", (e) => onEvent(e.data));
  const emit = (event) => {
    onEvent(event);
    channel.postMessage(event);
  };

  // A new sign-in replaces whatever the sources stored before.
  const stored = load();
  if (seed && stored.seed !== seed) save({ clientId, seed, refresh: seed });

  if (!navigator.locks) return;
  navigator.locks.request("sd-twitch-feed", async () => {
    for (let delay = 2000; ; delay = Math.min(delay * 2, 300000)) {
      try {
        await run(clientId, emit);
        delay = 2000;
      } catch (error) {
        emit({ type: "status", ok: false, note: String(error.message ?? error) });
      }
      await wait(delay);
    }
  });
}

async function token(clientId) {
  const state = load();
  if (state.access && state.expires > Date.now() + 120000) return state;
  if (!state.refresh) throw new Error("not signed in to Twitch");
  const res = await fetch(`${AUTH}/token`, {
    method: "POST",
    body: new URLSearchParams({ client_id: clientId, grant_type: "refresh_token", refresh_token: state.refresh }),
  });
  if (!res.ok) throw new Error(`token refresh ${res.status}`);
  const data = await res.json();
  const next = { ...state, clientId, access: data.access_token, refresh: data.refresh_token, expires: Date.now() + data.expires_in * 1000 };
  save(next);
  return next;
}

async function helix(clientId, path, init = {}) {
  const { access } = await token(clientId);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Client-Id": clientId, Authorization: `Bearer ${access}`, "Content-Type": "application/json", ...init.headers },
  });
  if (res.status === 401) {
    save({ ...load(), access: null });
    throw new Error(`${path} 401`);
  }
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const tier = (t) => `Tier ${Number(t) / 1000 || 1}`;
const who = (e, key = "user") => (e.is_anonymous ? "Anonymous" : e[`${key}_name`] ?? e[`${key}_login`] ?? "");

// EventSub event → a stream alert. Gifted subs arrive twice (the gift, then
// each recipient's subscribe); the gift is the one shown.
function toAlert(type, e) {
  switch (type) {
    case "channel.follow":
      return { kind: "follow", name: who(e) };
    case "channel.subscribe":
      return e.is_gift ? null : { kind: "sub", name: who(e), detail: tier(e.tier) };
    case "channel.subscription.message":
      return { kind: "sub", name: who(e), detail: `${tier(e.tier)} · ${e.cumulative_months} months` };
    case "channel.subscription.gift":
      return { kind: "sub", name: who(e), detail: `Gifted ${e.total} ${e.total === 1 ? "sub" : "subs"}`, amount: e.total };
    case "channel.cheer":
      return { kind: "bits", name: who(e), detail: `Cheered ${e.bits} bits` };
    case "channel.raid":
      return { kind: "raid", name: e.from_broadcaster_user_name, detail: `Raiding with ${e.viewers} viewers` };
    default:
      return null;
  }
}

// One feed session: who we are, where things stand, then live events until
// the socket drops. Returns (or throws) to be run again.
async function run(clientId, emit) {
  const { access } = await token(clientId);
  const check = await fetch(`${AUTH}/validate`, { headers: { Authorization: `OAuth ${access}` } });
  if (!check.ok) {
    save({ ...load(), access: null });
    throw new Error(`validate ${check.status}`);
  }
  const { user_id: id } = await check.json();

  const followers = await helix(clientId, `/channels/followers?broadcaster_id=${id}&first=1`);
  if (followers.data?.[0]) emit({ type: "latest", kind: "follow", name: followers.data[0].user_name });
  const subs = await helix(clientId, `/subscriptions?broadcaster_id=${id}&first=1`).catch(() => null);
  if (subs) emit({ type: "goal", kind: "sub", value: subs.total });

  const topics = [
    ["channel.follow", "2", { broadcaster_user_id: id, moderator_user_id: id }],
    ["channel.subscribe", "1", { broadcaster_user_id: id }],
    ["channel.subscription.message", "1", { broadcaster_user_id: id }],
    ["channel.subscription.gift", "1", { broadcaster_user_id: id }],
    ["channel.cheer", "1", { broadcaster_user_id: id }],
    ["channel.raid", "1", { to_broadcaster_user_id: id }],
  ];

  await new Promise((resolve, reject) => {
    let socket;
    let watchdog;
    let validator;
    const finish = (error) => {
      clearTimeout(watchdog);
      clearInterval(validator);
      try {
        socket?.close();
      } catch {}
      error ? reject(error) : resolve();
    };
    // Twitch asks for a check every hour that the token still works.
    validator = setInterval(async () => {
      try {
        const { access } = await token(clientId);
        const res = await fetch(`${AUTH}/validate`, { headers: { Authorization: `OAuth ${access}` } });
        if (!res.ok) finish(new Error(`validate ${res.status}`));
      } catch (error) {
        finish(error);
      }
    }, 3600000);

    const open = (url, fresh) => {
      const ws = new WebSocket(url);
      const kick = (seconds) => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => finish(new Error("keepalive missed")), (seconds + 5) * 1000);
      };
      ws.addEventListener("message", async (e) => {
        const msg = JSON.parse(e.data);
        const kind = msg.metadata?.message_type;
        if (kind === "session_welcome") {
          const old = socket;
          socket = ws;
          if (old && old !== ws) old.close();
          kick(msg.payload.session.keepalive_timeout_seconds);
          if (!fresh) return;
          try {
            for (const [type, version, condition] of topics) {
              await helix(clientId, "/eventsub/subscriptions", {
                method: "POST",
                body: JSON.stringify({ type, version, condition, transport: { method: "websocket", session_id: msg.payload.session.id } }),
              }).catch((error) => emit({ type: "status", ok: false, note: `${type}: ${error.message}` }));
            }
            emit({ type: "status", ok: true, note: "live" });
          } catch (error) {
            finish(error);
          }
        } else if (kind === "session_keepalive") {
          if (ws === socket) kick(30);
        } else if (kind === "notification") {
          if (ws === socket) kick(30);
          const alert = toAlert(msg.payload.subscription.type, msg.payload.event);
          if (alert) emit({ type: "alert", alert });
        } else if (kind === "session_reconnect") {
          // The new socket replaces this one at its welcome; subscriptions carry over.
          open(msg.payload.session.reconnect_url, false);
        } else if (kind === "revocation") {
          emit({ type: "status", ok: false, note: `revoked: ${msg.payload.subscription.type}` });
        }
      });
      ws.addEventListener("close", () => {
        if (ws === socket) finish(new Error("socket closed"));
      });
      if (!socket) socket = ws;
    };
    open(WS, true);
  });
}
