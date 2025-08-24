import fetch from "node-fetch";
import 'dotenv/config'; // automatically loads variables from .env


const ROBLOSECURITY = process.env.ROBLOSECURITY?.includes("|_")
  ? process.env.ROBLOSECURITY.split("|_")[1]
  : process.env.ROBLOSECURITY;

if (!ROBLOSECURITY) {
  console.error("❌ Missing ROBLOSECURITY env variable");
  process.exit(1);
}

// Get x-csrf-token (needed for authenticated requests)
async function getXcsrfToken() {
  const res = await fetch("https://auth.roblox.com/v2/logout", {
    method: "POST",
    headers: { "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}` },
  });
  const token = res.headers.get("x-csrf-token");
  if (!token) throw new Error("Failed to get x-csrf-token");
  return token;
}

// Fetch all roles for a given group
async function fetchGroupRoles(groupId) {
  const xcsrf = await getXcsrfToken();

  const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/roles`, {
    method: "GET",
    headers: {
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
      "x-csrf-token": xcsrf,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch roles: ${res.status} ${text}`);
  }

  const data = await res.json();
  const roles = data.roles.map(role => ({
    name: role.name,
    roleId: role.id,
    rank: role.rank
  }));

  console.log("📄 Roles in group:", JSON.stringify(roles, null, 2));
  return roles;
}

// Example usage:
fetchGroupRoles(903643771)
  .catch(err => console.error("❌ Error:", err));
