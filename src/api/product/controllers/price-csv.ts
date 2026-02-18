import fs from "node:fs";

const UID = "api::product.product";

// какие колонки будут в CSV
const CSV_HEADER = [
  "slug",
  "title",
  "isActive",
  "brand",
  "cat",
  "module",
  "collection",
  "collectionBadge",
  "priceUZS",
  "priceRUB",
  "oldPriceUZS",
  "oldPriceRUB",
  "sortOrder",
];

const BRAND_ENUM = new Set([
  "scandy",
  "amber",
  "salvador",
  "buongiorno",
  "elizabeth",
  "pitti",
]);

const CAT_ENUM = new Set([
  "fasadi",
  "komody",
  "krovati",
  "plintusy",
  "polki",
  "shkafy",
  "stellaji",
  "stoli",
  "tumby",
  "veshalki",
  "vitrini",
  "zerkala",
  "pufi",
  "bedrooms",
  "living",
  "youth",
]);

// Алиасы (твои CSV-значения -> значения схемы)
const CAT_ALIASES: Record<string, string> = {
  tumbi: "tumby",
  tumba: "tumby",
  "tumby-tv": "tumby", // если у тебя в CSV так встречается
  dekor: "fasadi", // ⚠️ ВАЖНО: если "dekor" это не категория, а модуль — лучше исправить CSV. Но так хоть не будет Draft.
};

const BADGE_ENUM = [
  "Хит продаж",
  "Лучшая цена",
  "Супер акция",
  "Распродажа",
  "Только сегодня ", // да, с пробелом в конце
  "Успейте купить",
];

function esc(v: any) {
  const s = String(v ?? "");
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: any[]) {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    lines.push(CSV_HEADER.map((k) => esc((r as any)[k])).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

function parseCsv(text: string) {
  const src = String(text ?? "").replace(/^\uFEFF/, "");
  const out: Record<string, string>[] = [];

  let cur = "";
  let inQ = false;
  let row: string[] = [];
  const rows: string[][] = [];

  const pushCell = () => {
    row.push(cur);
    cur = "";
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQ) {
      if (ch === '"') {
        const next = src[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQ = true;
      continue;
    }
    if (ch === ",") {
      pushCell();
      continue;
    }
    if (ch === "\n") {
      pushCell();
      pushRow();
      continue;
    }
    if (ch === "\r") continue;

    cur += ch;
  }

  pushCell();
  pushRow();

  const header = (rows[0] ?? []).map((h) => String(h ?? "").trim());
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.length) continue;

    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = String(r[idx] ?? "").trim();
    });

    if (obj.slug) out.push(obj);
  }

  return out;
}

function getUploadedFile(ctx: any) {
  const f1 = ctx.request?.files?.file;
  const f2 = ctx.request?.files?.files?.file;
  const raw = f1 ?? f2;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

const toNumOrNull = (v: any) => {
  const s = String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toBoolOrNull = (v: any) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "") return null;
  if (["true", "1", "yes", "да"].includes(s)) return true;
  if (["false", "0", "no", "нет"].includes(s)) return false;
  return null;
};

function normLower(v: any) {
  return String(v ?? "").trim().toLowerCase();
}

// badge: матчим по trim() к допустимым, но возвращаем каноническое значение (включая пробелы)
function normalizeBadge(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const hit = BADGE_ENUM.find((x) => String(x).trim() === s);
  return hit ?? null;
}

function normalizeCat(v: any) {
  const raw = normLower(v);
  if (!raw) return null;
  const aliased = CAT_ALIASES[raw] ?? raw;
  if (CAT_ENUM.has(aliased)) return aliased;
  return null;
}

async function findProductsBySlug(slug: string) {
  const list = await strapi.db.query(UID).findMany({
    where: { slug },
    select: ["id", "slug", "documentId", "publishedAt"],
    orderBy: { id: "desc" },
    limit: 50,
  });
  return Array.isArray(list) ? list : [];
}

export default {
  // GET /product-export
  async export(ctx: any) {
    const products = await strapi.db.query(UID).findMany({
      select: [
        "id",
        "slug",
        "title",
        "isActive",
        "brand",
        "cat",
        "module",
        "collection",
        "collectionBadge",
        "priceUZS",
        "priceRUB",
        "oldPriceUZS",
        "oldPriceRUB",
        "sortOrder",
      ],
      orderBy: { id: "asc" },
      limit: 10000,
    });

    const map = new Map<string, any>();
    for (const p of products ?? []) {
      const slug = String(p.slug ?? "").trim();
      if (!slug) continue;
      const prev = map.get(slug);
      if (!prev || (p.id ?? 0) > (prev.id ?? 0)) map.set(slug, p);
    }

    const deduped = Array.from(map.values()).sort((a, b) =>
      String(a.slug ?? "").localeCompare(String(b.slug ?? "")),
    );

    const rows = deduped.map((p: any) => ({
      slug: p.slug ?? "",
      title: p.title ?? "",
      isActive: typeof p.isActive === "boolean" ? String(p.isActive) : "",
      brand: p.brand ?? "",
      cat: p.cat ?? "",
      module: p.module ?? "",
      collection: p.collection ?? "",
      collectionBadge: p.collectionBadge ?? "",
      priceUZS: p.priceUZS ?? "",
      priceRUB: p.priceRUB ?? "",
      oldPriceUZS: p.oldPriceUZS ?? "",
      oldPriceRUB: p.oldPriceRUB ?? "",
      sortOrder: p.sortOrder ?? "",
    }));

    const csvData = toCsv(rows);

    ctx.set("Content-Type", "text/csv; charset=utf-8");
    ctx.set("Content-Disposition", 'attachment; filename="products.csv"');
    ctx.body = csvData;
  },

  // POST /product-import
  async import(ctx: any) {
    const file = getUploadedFile(ctx);
    if (!file) return ctx.badRequest("CSV file is required");

    const filePath = file.filepath || file.path;
    if (!filePath) return ctx.badRequest("Uploaded file path not found");

    const text = fs.readFileSync(filePath, "utf-8");
    const rows = parseCsv(text);

    let updated = 0;
    let created = 0;
    let skipped = 0;
    let dedupRemoved = 0;
    let invalid = 0;

    for (const row of rows) {
      const slug = String(row.slug ?? "").trim();
      if (!slug) {
        skipped++;
        continue;
      }

      const data: any = {};

      const title = String(row.title ?? "").trim();
      if (title) data.title = title;

      const brandRaw = normLower(row.brand);
      if (brandRaw) {
        if (BRAND_ENUM.has(brandRaw)) data.brand = brandRaw;
        else {
          invalid++;
          strapi.log.warn(`[CSV] invalid brand="${row.brand}" slug=${slug}`);
        }
      }

      const catNorm = normalizeCat(row.cat);
      if (catNorm) data.cat = catNorm;
      else if (String(row.cat ?? "").trim()) {
        invalid++;
        strapi.log.warn(`[CSV] invalid cat="${row.cat}" slug=${slug}`);
      }

      const module = String(row.module ?? "").trim();
      if (module) data.module = module;

      const collection = String(row.collection ?? "").trim();
      if (collection) data.collection = collection;

      const badgeNorm = normalizeBadge(row.collectionBadge);
      if (badgeNorm) data.collectionBadge = badgeNorm;
      else if (String(row.collectionBadge ?? "").trim()) {
        invalid++;
        strapi.log.warn(
          `[CSV] invalid collectionBadge="${row.collectionBadge}" slug=${slug}`,
        );
      }

      const b = toBoolOrNull(row.isActive);
      if (b !== null) data.isActive = b;

      const pU = toNumOrNull(row.priceUZS);
      if (pU !== null) data.priceUZS = pU;

      const pR = toNumOrNull(row.priceRUB);
      if (pR !== null) data.priceRUB = pR;

      const oU = toNumOrNull(row.oldPriceUZS);
      if (oU !== null) data.oldPriceUZS = oU;

      const oR = toNumOrNull(row.oldPriceRUB);
      if (oR !== null) data.oldPriceRUB = oR;

      const so = toNumOrNull(row.sortOrder);
      if (so !== null) data.sortOrder = so;

      if (Object.keys(data).length === 0) {
        skipped++;
        continue;
      }

      // publish/unpublish если isActive пришёл
      if (b === true) data.publishedAt = new Date();
      if (b === false) data.publishedAt = null;

      const existingAll = await findProductsBySlug(slug);

      if (existingAll.length) {
        const keep = existingAll[0];
        const extras = existingAll.slice(1);

        // ✅ обновляем через documents layer, чтобы CM и API были консистентны
        if (keep.documentId) {
          await strapi.documents(UID).update({
            documentId: keep.documentId,
            data: { slug, ...data, locale: "en" },
          });
        } else {
          // fallback (на всякий)
          await strapi.db.query(UID).update({
            where: { id: keep.id },
            data: { slug, ...data },
          });
        }
        updated++;

        // удаляем дубли
        for (const ex of extras) {
          if (ex.documentId) {
            await strapi.documents(UID).delete({ documentId: ex.documentId });
          } else {
            await strapi.db.query(UID).delete({ where: { id: ex.id } });
          }
          dedupRemoved++;
        }
      } else {
        // ✅ создаём ТОЛЬКО через documents layer
        await strapi.documents(UID).create({
          data: {
            slug,
            ...data,
            locale: "en",
          },
        });
        created++;
      }
    }

    ctx.send({ ok: true, updated, created, skipped, invalid, dedupRemoved });
  },
};
