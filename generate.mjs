// gen card-dark.svg / card-light.svg — run: GITHUB_TOKEN=xxx node generate.mjs
const LOGIN = "onlyakr";

// ── content: แก้ card ที่ object นี้ที่เดียว ──────────────────────────
// value เป็น null = เติมจาก GitHub API ตอนรัน
const CARD = (s) => [
  { header: `${LOGIN}@github` },
  { key: "OS", value: "macOS" },
  { key: "Uptime", value: s.uptime },
  { key: "Expertise", value: "Full Stack (Intern)" },
  { key: "Projects", value: "ez-fleet, Yuen" },
  { key: "IDE", value: "VS Code" },
  {},
  { key: "Languages.Programming", value: "TypeScript, JavaScript, SQL" },
  { key: "Languages.Real", value: "Thai, English" },
  {},
  { header: "Contact" },
  { key: "Email", value: "onlyakr2477@gmail.com" },
  { key: "GitHub", value: `github.com/${LOGIN}` },
  {},
  { header: "GitHub Stats" },
  { key: "Repos", value: `${s.repos} | Stars: ${s.stars}` },
  { key: "Commits", value: `${s.commits} | Followers: ${s.followers}` },
];

// ── fetch stats ───────────────────────────────────────────────────────
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN required");

async function gql(query) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? res.status));
  return json.data;
}

const { user } = await gql(`query { user(login: "${LOGIN}") {
  createdAt
  followers { totalCount }
  repositories(ownerAffiliations: OWNER, first: 100) { totalCount nodes { stargazerCount } }
}}`); // ponytail: stars นับแค่ 100 repos แรก — paginate เมื่อ repos เกิน 100

// commits ทั้งชีวิต: contributionsCollection จำกัดช่วง 1 ปี → alias query ทีละปีในครั้งเดียว
const startYear = new Date(user.createdAt).getUTCFullYear();
const nowYear = new Date().getUTCFullYear();
const years = Array.from({ length: nowYear - startYear + 1 }, (_, i) => startYear + i);
const perYear = await gql(`query { user(login: "${LOGIN}") {
  ${years.map((y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { totalCommitContributions restrictedContributionsCount }`).join("\n")}
}}`);
const commits = years.reduce((sum, y) => {
  const c = perYear.user[`y${y}`];
  return sum + c.totalCommitContributions + c.restrictedContributionsCount;
}, 0);

const days = Math.floor((Date.now() - new Date(user.createdAt)) / 86400000);
const stats = {
  repos: user.repositories.totalCount,
  stars: user.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0),
  commits: commits.toLocaleString("en-US"),
  followers: user.followers.totalCount,
  uptime: `${Math.floor(days / 365)} years, ${Math.floor((days % 365) / 30)} months, ${(days % 365) % 30} days`,
};

// ── render SVG ────────────────────────────────────────────────────────
const W = 58; // ความกว้าง card เป็นตัวอักษร
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const THEMES = {
  dark: { fg: "#e6edf3", key: "#ffa657", dim: "#8b949e", header: "#ff7b72" },
  light: { fg: "#1f2328", key: "#e36209", dim: "#6e7781", header: "#cf222e" },
};

function render(theme) {
  const c = THEMES[theme];
  const lines = CARD(stats).map((row) => {
    if (row.header) {
      const bar = "─".repeat(W - row.header.length - 4);
      return `<tspan fill="${c.header}">${esc(row.header)}</tspan> <tspan fill="${c.dim}">${bar}</tspan>`;
    }
    if (!row.key) return " "; // บรรทัดว่าง
    const used = 2 + row.key.length + 2 + 1 + row.value.length; // ". key: " + " " + value
    const dots = ".".repeat(Math.max(1, W - used));
    return `<tspan fill="${c.dim}">. </tspan><tspan fill="${c.key}">${esc(row.key)}</tspan><tspan fill="${c.dim}">: ${dots} </tspan><tspan fill="${c.fg}">${esc(row.value)}</tspan>`;
  });
  const lineH = 22, pad = 24;
  const height = lines.length * lineH + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="${height}" viewBox="0 0 560 ${height}">
<style>text { font: 14px "SFMono-Regular", Consolas, Menlo, monospace; white-space: pre; }</style>
${lines.map((l, i) => `<text x="${pad}" y="${pad + (i + 1) * lineH - 6}" fill="${c.fg}">${l}</text>`).join("\n")}
</svg>`;
}

import { writeFileSync } from "node:fs";
for (const theme of Object.keys(THEMES)) writeFileSync(`card-${theme}.svg`, render(theme));
console.log(`✓ card-dark.svg / card-light.svg — repos:${stats.repos} stars:${stats.stars} commits:${stats.commits} followers:${stats.followers}`);
