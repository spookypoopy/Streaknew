export async function onRequestPost({ request, env }) {
  const { action, username, password } = await request.json();
  if (!action) return json({ error: "missing action" }, 400);

  if (action === "signup") {
    if (!username || !password) return json({ error:"missing creds" }, 400);
    const key = `user:${username}`;
    const existing = await env.USERS_KV.get(key, "json");
    if (existing) return json({ error:"exists" }, 409);
    const salt = randomHex(8);
    const pwHash = await sha256(password + salt);
    const user = { username, pwHash, salt, balance: Number(env.START_BALANCE||25), faucetAt: 0, clientSeed: randomHex(16), nonce: 0 };
    await env.USERS_KV.put(key, JSON.stringify(user));
    return json({ ok:true });
  }

  if (action === "login") {
    const key = `user:${username}`;
    const user = await env.USERS_KV.get(key, "json");
    if (!user) return json({ error:"not_found" }, 404);
    const pwHash = await sha256(password + (user.salt||""));
    if (pwHash !== user.pwHash) return json({ error:"invalid" }, 401);
    const token = await sha256(username + Date.now() + Math.random());
    await env.USERS_KV.put(`sess:${token}`, username, { expirationTtl: Number(env.SESSION_TTL_SECONDS||604800) });
    return json({ ok:true, token, username, balance:user.balance||0, faucetAt:user.faucetAt||0 });
  }

  return json({ error:"bad_action" }, 400);
}

async function sha256(str){const buf=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function randomHex(n=16){const u=new Uint8Array(n); crypto.getRandomValues(u); return [...u].map(b=>b.toString(16).padStart(2,"0")).join("");}
function json(obj, status=200){ return new Response(JSON.stringify(obj), {status, headers:{ "content-type":"application/json" }}); }
