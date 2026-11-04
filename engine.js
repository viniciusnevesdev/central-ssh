import { CATEGORIES, SEED_COMMANDS } from "./dados.js";

export const STORAGE_KEY = "comandos:pwa:v1";
export const BACKUP_VERSION = 1;
export const MAX_ITEMS = 400;

export function shellQuote(value) {
  const v = String(value ?? "");
  if (v.includes("\0") || /[\r\n]/.test(v)) throw Error("Valor não pode conter quebra de linha.");
  return "'" + v.replace(/'/g, "'\"'\"'") + "'";
}

export function extractVariables(template) {
  const matches = [...String(template).matchAll(/\{\{([a-zA-Z][a-zA-Z0-9_]{0,30})\}\}/g)];
  return [...new Set(matches.map(m => m[1]))];
}

export function validateNumber(value, min = 1, max = 24) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) throw Error("Informe um número inteiro.");
  const n = Number(text);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw Error("Escolha um número entre " + min + " e " + max + ".");
  return String(n);
}

export function buildCommand(item, answers = {}) {
  if (!item || typeof item.command !== "string") throw Error("Comando inválido.");
  const vars = extractVariables(item.command);
  const meta = Array.isArray(item.variables) ? item.variables : [];
  let cmd = item.command;
  for (const name of vars) {
    const def = meta.find(v => v.name === name) || { name, type:"text", default:"" };
    const val = Object.hasOwn(answers,name) ? answers[name] : def.default;
    const result = def.type === "number"
      ? validateNumber(val, Number.isFinite(def.min) ? def.min : 1, Number.isFinite(def.max) ? def.max : 100000)
      : (() => {
          const s = String(val ?? "").trim();
          if (!s || s.length > 150) throw Error("Preencha o campo " + (def.label || name) + " (até 150 caracteres).");
          return shellQuote(s);
        })();
    cmd = cmd.replaceAll("{{" + name + "}}", result);
  }
  return cmd;
}

export function riskyCommand(command) {
  const c = String(command).toLowerCase();
  return /(?:rm\s+-[a-z]*r[a-z]*f|rm\s+-[a-z]*f[a-z]*r|git\s+(?:push\s+--force|reset\s+--hard|clean\s+-[a-z]*f)|(?:mkfs|dd)\s|(?:curl|wget)[^\n]*\|\s*(?:sh|bash)|:\s*>\s*\/|shutdown|poweroff|reboot)/i.test(c);
}

function limited(value, length) {
  return String(value ?? "").trim().replace(/[\0-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, length);
}

export function normalizeItem(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Item inválido no backup.");
  const id = limited(input.id, 90);
  const title = limited(input.title, 90);
  const command = limited(input.command, 4000);
  if (!id || !/^[\w-]+$/.test(id) || !title || !command) throw Error("Comando sem identificador, título ou texto válido.");
  const cat = limited(input.category, 30);
  const category = CATEGORIES.some(x => x.id === cat) ? cat : "Pessoal";
  const sourceVars = Array.isArray(input.variables) ? input.variables : [];
  const variables = extractVariables(command).map(name => {
    const original = sourceVars.find(x => x && x.name === name) || {};
    const type = original.type === "number" ? "number" : "text";
    return {
      name, label:limited(original.label || name,40),
      type, ...(type === "number" ? {
        min: Number.isSafeInteger(original.min) ? original.min : 1,
        max: Number.isSafeInteger(original.max) ? original.max : 100000,
      } : {}),
      default: type === "number"
        ? (Number.isSafeInteger(Number(original.default)) ? Number(original.default) : 1)
        : limited(original.default, 150)
    };
  });
  return {
    id, title, category, command, description:limited(input.description, 240),
    favorite: Boolean(input.favorite),
    risk: input.risk === "atencao" || riskyCommand(command) ? "atencao" : "normal",
    tags:(Array.isArray(input.tags) ? input.tags : []).slice(0,12).map(v=>limited(v,30)).filter(Boolean),
    variables
  };
}

export function parseBackup(text) {
  if (typeof text !== "string" || text.length > 2_000_000) throw Error("Backup inválido ou muito grande.");
  let backup;
  try { backup = JSON.parse(text); } catch { throw Error("Arquivo JSON inválido."); }
  if (!backup || backup.version !== BACKUP_VERSION || !Array.isArray(backup.items)) {
    throw Error("Formato de backup incompatível.");
  }
  if (backup.items.length > MAX_ITEMS) throw Error("Backup com mais de " + MAX_ITEMS + " comandos.");
  const ids = new Set();
  const items = backup.items.map(input => {
    const item = normalizeItem(input);
    if (ids.has(item.id)) throw Error("Backup contém identificadores duplicados.");
    ids.add(item.id);
    return item;
  });
  return items;
}

export function serializeBackup(items) {
  return JSON.stringify({
    app:"Comandos", version:BACKUP_VERSION, exportedAt:new Date().toISOString(),
    items:items.map(normalizeItem)
  },null,2);
}

export function initialItems() {
  return SEED_COMMANDS.map(normalizeItem);
}
