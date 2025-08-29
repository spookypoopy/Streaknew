export async function onRequestPost({ request, env }) {
  const { token } = await request.json();
  const username = await env.USERS_KV.get(`sess:${token}`);
  if (!username) return json({ error:"unauth" }, 401);
  const user = await env.USERS_KV.get(`user:${username}`, "json");
  if (!user) return json({ error:"not_found" }, 404);
  return json({ ok:true, username, balance:user.balance||0, faucetAt:user.faucetAt||0, clientSeed:user.clientSeed||"", nonce:user.nonce||0 });
}
function json(o,s=200){ return new Response(JSON.stringify(o), {status:s, headers:{ "content-type":"application/json" }}); }
