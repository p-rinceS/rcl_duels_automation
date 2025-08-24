import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// load ROBLOSECURITY from environment variable
let rawCookie = process.env.ROBLOSECURITY;
if (!rawCookie) {
  console.error("❌ Missing ROBLOSECURITY env variable");
  process.exit(1);
}
const ROBLOSECURITY = rawCookie.includes("|_")
  ? rawCookie.split("|_")[1] // strip warning wrapper if present
  : rawCookie;

// get a fresh x-csrf-token
async function getXcsrfToken() {
  const res = await fetch("https://auth.roblox.com/v2/logout", {
    method: "POST",
    headers: {
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
    }
  });

  return res.headers.get("x-csrf-token");
}

// change user rank
async function setUserRank(groupId, userId, roleId) {
  const xcsrf = await getXcsrfToken();

  const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
      "x-csrf-token": xcsrf,
    },
    body: JSON.stringify({ roleId }),
  });

  return {
    status: res.status,
    body: await res.text()
  };
}

// API endpoint your Roblox game will call
app.post("/setrank", async (req, res) => {
  try {
    const { groupId, userId, roleId } = req.body;

    if (!groupId || !userId || !roleId) {
      return res.status(400).json({ error: "Missing groupId, userId, or roleId" });
    }

    const result = await setUserRank(groupId, userId, roleId);
    res.status(result.status).send(result.body);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Rank bot API running on port ${PORT}`);
});
