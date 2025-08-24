import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // load ROBLOSECURITY from environment variable
  let rawCookie = process.env.ROBLOSECURITY;
  if (!rawCookie) {
    console.error("❌ Missing ROBLOSECURITY env variable");
    return res.status(500).json({ error: "Missing ROBLOSECURITY" });
  }
  const ROBLOSECURITY = rawCookie.includes("|_")
    ? rawCookie.split("|_")[1] // strip warning wrapper if present
    : rawCookie;

  const { groupId, userId, roleId } = req.body;

  if (!groupId || !userId || !roleId) {
    return res.status(400).json({ error: "Missing groupId, userId, or roleId" });
  }

  try {
    // get fresh x-csrf-token
    const getXcsrfToken = async () => {
      const res = await fetch("https://auth.roblox.com/v2/logout", {
        method: "POST",
        headers: { "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}` },
      });
      return res.headers.get("x-csrf-token");
    };

    const xcsrf = await getXcsrfToken();

    const robloxRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
        "x-csrf-token": xcsrf,
      },
      body: JSON.stringify({ roleId }),
    });

    const bodyText = await robloxRes.text();

    return res.status(robloxRes.status).send(bodyText);

  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
