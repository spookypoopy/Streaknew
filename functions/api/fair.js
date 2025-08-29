export async function onRequestPost({ request, env }) {
  const { action, token, clientSeed } = await request.json();

  if (action === "status") {
    const username = await env.USERS_KV.get(`sess:${token}`);
    if (!username) return json({ error:"unauth" }, 401);
    const user = await env.USERS_KV.get(`user:${username}`, "json");
    if (!user) return json({ error:"not_found" }, 404);
    const serverSeed = (await env.USERS_KV.get("pf:current")) || env.PF_SERVER_SEED || "seed";
    const serverHash = await hashHex(serverSeed);
    return json({ ok:true, serverHash, clientSeed: user.clientSeed || "", nonce: user.nonce || 0 });
  }

  if (action === "setClientSeed") {
    const username = await env.USERS_KV.get(`sess:${token}`);
    if (!username) return json({ error:"unauth" }, 401);
    const key = `user:${username}`;
    const user = await env.USERS_KV.get(key, "json");
    if (!user) return json({ error:"not_found" }, 404);
    user.clientSeed = clientSeed || user.clientSeed || "";
    await env.USERS_KV.put(key, JSON.stringify(user));
    return json({ ok:true, clientSeed: user.clientSeed });
  }

  return json({ error:"bad_action" }, 400);
}

async function hashHex(str){ const buf=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }
function json(o,s=200){ return new Response(JSON.stringify(o), { status:s, headers:{ "content-type":"application/json" }}); }
