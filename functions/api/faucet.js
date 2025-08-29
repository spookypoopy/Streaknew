export async function onRequestPost({ request, env }) {
  const { token } = await request.json();
  const username = await env.USERS_KV.get(`sess:${token}`);
  if (!username) return json({ error: "unauth" }, 401);

  const key = `user:${username}`;
  const user = await env.USERS_KV.get(key, "json");
  if (!user) return json({ error: "not_found" }, 404);

  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;
  if (now < (user.faucetAt || 0) + cooldown) {
    return json({ ok: false, next: (user.faucetAt + cooldown) - now });
  }
  const min = Number(env.FAUCET_MIN || 5);
  const max = Number(env.FAUCET_MAX || 10);
  const reward = Math.floor(min + Math.random() * (max - min + 1));
  user.balance = (user.balance || 0) + reward;
  user.faucetAt = now;

  await env.USERS_KV.put(key, JSON.stringify(user));
  return json({ ok: true, reward, balance: user.balance, next: cooldown });
}
function json(obj, status=200){ return new Response(JSON.stringify(obj), { status, headers: { "content-type":"application/json" }}); }
