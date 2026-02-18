// scripts/import-products.mjs
// Node 18+
// Usage:
//   STRAPI_URL="https://lioneto-cms.ru" STRAPI_TOKEN="xxx" node scripts/import-products.mjs --file ./products.csv --mode upsert
//   STRAPI_URL="https://lioneto-cms.ru" STRAPI_TOKEN="xxx" node scripts/import-products.mjs --file ./products.csv --mode overwrite
//
// CSV columns (header):
// slug,title,isActive,brand,cat,module,collection,collectionBadge,priceUZS,priceRUB,oldPriceUZS,oldPriceRUB,sortOrder

import fs from "node:fs";
import path from "node:path";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

const FILE = arg("--file");
const MODE = (arg("--mode") || "upsert").toLowerCase(); // upsert | overwrite

const STRAPI_URL = process.env.STRAPI_URL?.replace(/\/$/, "");
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!FILE) {
  console.error("❌ Missing --file ./products.csv");
  process.exit(1);
}
if (!STRAPI_URL || !STRAPI_TOKEN) {
  console.error("❌ Missing env STRAPI_URL and/or STRAPI_TOKEN");
  process.exit(1);
}
if (!["upsert", "overwrite"].includes(MODE)) {
  console.error("❌ --mode must be upsert or overwrite");
  process.exit(1);
}

function toInt(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/\s+/g, "").replace(/,/g, "."));
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}
function toBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "y", "да"].includes(s)) return true;
  if (["0", "false", "no", "n", "нет"].includes(s)) return false;
  return null;
}
function normStr(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function parseCSV(text) {
  // простая CSV-парсерка (с поддержкой кавычек)
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQ && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && (ch === "," || ch === "\t" || ch === ";")) {
      row.push(cur);
      cur = "";
      continue;
    }
    if (!inQ && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      cur = "";
      // пропускаем пустые строки
      if (row.some((x) => String(x).trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  row.push(cur);
  if (row.some((x) => String(x).trim() !== "")) rows.push(row);
  return rows;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const txt = await res.text();
  let json = null;
  try {
    json = txt ? JSON.parse(txt) : null;
  } catch {}
  if (!res.ok) {
    const msg = json ? JSON.stringify(json) : txt;
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${msg}`);
  }
  return json;
}

async function findBySlug(slug) {
  const u = new URL(`${STRAPI_URL}/api/products`);
  u.searchParams.set("filters[slug][$eq]", slug);
  u.searchParams.set("pagination[pageSize]", "1");
  const json = await apiFetch(u.toString(), { method: "GET" });
  const item = json?.data?.[0] ?? null;
  return item; // {id, ...fields}
}

async function createProduct(fields) {
  // Strapi v5: body { data: {...} }
  const body = { data: fields };
  const json = await apiFetch(`${STRAPI_URL}/api/products`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return json?.data ?? null;
}

async function updateProduct(id, fields) {
  const body = { data: fields };
  const json = await apiFetch(`${STRAPI_URL}/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return json?.data ?? null;
}

async function deleteProduct(id) {
  await apiFetch(`${STRAPI_URL}/api/products/${id}`, { method: "DELETE" });
}

async function listAllProducts() {
  // тянем все slug/id, чтобы сделать overwrite
  const pageSize = 200;
  let page = 1;
  let all = [];
  while (true) {
    const u = new URL(`${STRAPI_URL}/api/products`);
    u.searchParams.set("pagination[page]", String(page));
    u.searchParams.set("pagination[pageSize]", String(pageSize));
    const json = await apiFetch(u.toString(), { method: "GET" });
    const data = Array.isArray(json?.data) ? json.data : [];
    all.push(...data);
    const total = json?.meta?.pagination?.total ?? all.length;
    if (all.length >= total) break;
    page++;
  }
  return all;
}

function mapRowToFields(h, row) {
  const get = (k) => row[h[k]];

  const slug = normStr(get("slug"));
  if (!slug) return { slug: null, fields: null, skip: "no slug" };

  const isActive = toBool(get("isActive"));
  const title = normStr(get("title"));

  const fields = {
    slug,
    title: title ?? slug,

    isActive: isActive ?? true,
    brand: normStr(get("brand")),
    cat: normStr(get("cat")),
    module: normStr(get("module")),
    collection: normStr(get("collection")),
    collectionBadge: normStr(get("collectionBadge")),

    priceUZS: toInt(get("priceUZS")),
    priceRUB: toInt(get("priceRUB")),
    oldPriceUZS: toInt(get("oldPriceUZS")),
    oldPriceRUB: toInt(get("oldPriceRUB")),
    sortOrder: toInt(get("sortOrder")),

    // ВАЖНО: для админки/CM — пусть Strapi сам ведёт локаль, но если i18n включен и default locale = en,
    // то эта строка помогает не "потеряться" после импорта.
    locale: "en",
  };

  // Публикация: если Draft&Publish включён, выставим publishedAt.
  // (Если не включён — Strapi просто проигнорит поле.)
  if (fields.isActive) fields.publishedAt = new Date().toISOString();
  else fields.publishedAt = null;

  return { slug, fields, skip: null };
}

async function main() {
  const abs = path.resolve(FILE);
  const text = fs.readFileSync(abs, "utf8");

  const rows = parseCSV(text);
  if (!rows.length) throw new Error("Empty CSV");

  const header = rows[0].map((s) => String(s).trim());
  const idx = {};
  header.forEach((k, i) => (idx[k] = i));

  const required = ["slug", "title"];
  for (const r of required) {
    if (!(r in idx)) throw new Error(`CSV missing column: ${r}`);
  }

  console.log(`✅ CSV rows: ${rows.length - 1}`);
  console.log(`✅ Mode: ${MODE}`);

  const seenSlugs = new Set();
  let created = 0,
    updated = 0,
    failed = 0,
    skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const { slug, fields, skip } = mapRowToFields(idx, row);
    if (skip) {
      skipped++;
      continue;
    }
    if (seenSlugs.has(slug)) {
      console.log(`⚠️ duplicate slug in CSV: ${slug} (row ${i + 1}), skipping`);
      skipped++;
      continue;
    }
    seenSlugs.add(slug);

    try {
      const existing = await findBySlug(slug);
      if (existing?.id) {
        await updateProduct(existing.id, fields);
        updated++;
        if ((updated + created) % 25 === 0)
          console.log(`...progress: created ${created}, updated ${updated}`);
      } else {
        await createProduct(fields);
        created++;
        if ((updated + created) % 25 === 0)
          console.log(`...progress: created ${created}, updated ${updated}`);
      }
    } catch (e) {
      failed++;
      console.error(`❌ ${slug}: ${e.message}`);
    }
  }

  if (MODE === "overwrite") {
    console.log("🧹 Overwrite: deleting entries not in CSV...");
    const all = await listAllProducts();
    let del = 0;
    for (const item of all) {
      const s = item?.slug ?? item?.attributes?.slug; // на всякий
      const id = item?.id;
      if (!id || !s) continue;
      if (!seenSlugs.has(String(s))) {
        await deleteProduct(id);
        del++;
      }
    }
    console.log(`🧹 Deleted: ${del}`);
  }

  console.log("✅ Done");
  console.log({ created, updated, skipped, failed });
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
