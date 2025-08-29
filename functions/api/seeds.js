export async function onRequestPost({ request, env }) {
  const { action, code, pass, note } = await request.json();

  if (action === "status") {
    const current = await env.USERS_KV.get("pf:commit") || (await hashHex(await env.USERS_KV.get("pf:current") || "")) || "";
    const reveal = await env.USERS_KV.get("pf:reveal") || "";
    return json({ currentCommit: current, lastReveal: reveal });
  }

  if (action === "commit") {
    if (code !== env.ADMIN_CODE || pass !== env.ADMIN_PASS) return json({ error:"forbidden" }, 403);
    const currentSeed = (await env.USERS_KV.get("pf:current")) || env.PF_SERVER_SEED || randomHex(32);
    const commit = await hashHex(currentSeed + (note || ""));
    await env.USERS_KV.put("pf:commit", commit);
    return json({ ok:true, commit });
  }

  if (action === "reveal") {
    if (code !== env.ADMIN_CODE || pass !== env.ADMIN_PASS) return json({ error:"forbidden" }, 403);
    const prev = (await env.USERS_KV.get("pf:prev")) || env.PF_SERVER_SEED || "";
    if (!prev) return json({ error:"no_prev" }, 400);
    await env.USERS_KV.put("pf:reveal", prev, { expirationTtl: 60*60*24*30 });
    return json({ ok:true, reveal: prev });
  }

  return json({ error:"bad_action" }, 400);
}

async function hashHex(str){ const buf=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }
function randomHex(n=32){ const u=new Uint8Array(n); crypto.getRandomValues(u); return [...u].map(b=>b.toString(16).padStart(2,"0")).join(""); }
function json(o,s=200){ return new Response(JSON.stringify(o), { status:s, headers:{ "content-type":"application/json" }}); }
