import fs from "node:fs";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("Defina SUPABASE_ACCESS_TOKEN para executar a verificação de multitenancy.");
}

const projectRef = fs.readFileSync("supabase/.temp/project-ref", "utf8").trim();
const query = fs.readFileSync("scripts/verify-multitenancy.sql", "utf8");
const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});
const payload = await response.json();
if (!response.ok) throw new Error(payload.message ?? "Falha ao executar a verificação de multitenancy.");

const result = payload[0];
if (!result?.all_passed) {
  throw new Error(`Falha de isolamento: ${JSON.stringify(result?.results ?? [])}`);
}

console.log(`Multitenancy validado: ${result.results.length} verificações passaram; a transação foi revertida.`);
