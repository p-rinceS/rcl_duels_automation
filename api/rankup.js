import fetch from "node-fetch";

const TIER_TO_ROLEID = {
  1: 507396024,  // Tier 1
  2: 507972042,  // Tier 2
  3: 508296021,  // Tier 3
  4: 508340033,  // Tier 4
  5: 507952028,  // Tier 5
  6: 507486030,  // Tier 6
  7: 508748017   // Tier 7
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Load ROBLOSECURITY from environment variable
  const rawCookie = process.env.ROBLOSECURITY;
  if (!rawCookie) {
    return res.status(500).json({ error: "Missing ROBLOSECURITY" });
  }
  const ROBLOSECURITY = rawCookie.includes("|_") ? rawCookie.split("|_")[1] : rawCookie;

  const { groupId, userId, tier } = req.body;

  if (!groupId || !userId || !tier) {
    return res.status(400).json({ error: "Missing groupId, userId, or tier" });
  }

  const roleId = TIER_TO_ROLEID[tier];
  if (!roleId) {
    return res.status(400).json({ error: "Invalid tier" });
  }

  try {
    // Get fresh x-csrf-token
    const getXcsrfToken = async () => {
      const res = await fetch("https://auth.roblox.com/v2/logout", {
        method: "POST",
        headers: { "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}` },
      });
      return res.headers.get("x-csrf-token");
    };

    const xcsrf = await getXcsrfToken();

    const robloxRes = await fetch(
      `https://groups.roblox.com/v1/groups/${groupId}/users/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
          "x-csrf-token": xcsrf,
        },
        body: JSON.stringify({ roleId }),
      }
    );

    const bodyText = await robloxRes.text();
    return res.status(robloxRes.status).send(bodyText);

  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
