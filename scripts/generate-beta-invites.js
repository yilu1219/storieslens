const crypto = require("crypto");

function code(region) {
  return `SL-${region.toUpperCase()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function hash(value) {
  return crypto.createHash("sha256").update(value.replace(/\s+/g, "").toUpperCase()).digest("hex");
}

const rows = ["cn", "us", "intl"].map((region) => {
  const inviteCode = code(region);
  return { region, inviteCode, entry: `${region}:founding-2026:${hash(inviteCode)}` };
});

process.stdout.write("StoriesLens founding beta codes — save these in a password manager; they are not written to disk.\n\n");
rows.forEach((row) => process.stdout.write(`${row.region.toUpperCase()}: ${row.inviteCode}\n`));
process.stdout.write(`\nBETA_INVITE_CODE_HASHES=${rows.map((row) => row.entry).join(";")}\n`);
