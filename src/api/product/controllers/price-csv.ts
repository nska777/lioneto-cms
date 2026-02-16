// src/api/product/controllers/price-csv.ts
import fs from "node:fs";

const UID = "api::product.product";

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

function esc(v: any) {
  const s = String(v ?? "");
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: any[]) {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) lines.push(CSV_HEADER.map((k) => esc(r?.[k])).join(","));
  return "\uFEFF" + lines.join("\n"); // BOM для Excel
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
    // игнорим совсем пустые строки
    if (row.length === 1 && String(row[0] ?? "").trim() === "") {
      row = [];
      return;
    }
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
    header.forEach((h, idx) => (obj[h] = String(r[idx] ?? "").trim()));

    const slug = String(obj.slug ?? "").trim();
    if (slug) out.push(obj);
  }

  return out;
}

function getUploadedFile(ctx: any) {
  const raw = ctx.request?.files?.file;
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

async function findAllBySlug(slug: string) {
  const list = await strapi.db.query(UID).findMany({
    where: { slug },
    select: ["id", "slug"],
    orderBy: { id: "desc" },
    limit: 1000,
  });
  return Array.isArray(list) ? list : [];
}

async function deleteByIds(ids: Array<number | string>) {
  for (const id of ids) {
    try {
      await strapi.db.query(UID).delete({ where: { id } });
    } catch (e) {
      strapi.log.warn(`[CSV] failed delete id=${id}: ${String(e)}`);
    }
  }
}

export default {
  // GET /price-export
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
        "publishedAt",
      ],
      orderBy: { id: "asc" },
      limit: 100000,
    });

    // дедуп по slug: берём самый свежий (по id)
    const map = new Map<string, any>();
    for (const p of products ?? []) {
      const slug = String(p?.slug ?? "").trim();
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

  // POST /price-import
  async import(ctx: any) {
    const file = getUploadedFile(ctx);
    if (!file) return ctx.badRequest("CSV file is required");

    const filePath = file.filepath || file.path; // v5/v4
    if (!filePath) return ctx.badRequest("Uploaded file path not found");

    const text = fs.readFileSync(filePath, "utf-8");
    const rows = parseCsv(text);

    strapi.log.info("[CSV] rows=" + rows.length);
    strapi.log.info("[CSV] first=" + JSON.stringify(rows[0] ?? {}));

    let updated = 0;
    let created = 0;
    let skipped = 0;
    let dedupDeleted = 0;

    for (const row of rows) {
      const slug = String(row.slug ?? "").trim();
      if (!slug) {
        skipped++;
        continue;
      }

      const data: any = {};

      // строки
      const title = String(row.title ?? "").trim();
      if (title) data.title = title;

      const brand = String(row.brand ?? "").trim();
      if (brand) data.brand = brand;

      const cat = String(row.cat ?? "").trim();
      if (cat) data.cat = cat;

      const module = String(row.module ?? "").trim();
      if (module) data.module = module;

      const collection = String(row.collection ?? "").trim();
      if (collection) data.collection = collection;

      const badge = String(row.collectionBadge ?? "").trim();
      if (badge) data.collectionBadge = badge;

      // boolean
      const b = toBoolOrNull(row.isActive);
      if (b !== null) data.isActive = b;

      // numbers
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

      // publish (если Draft/Publish включён)
      data.publishedAt = new Date();

      // ✅ главное: обновляем по slug, и чистим дубли
      const existingList = await findAllBySlug(slug);

      if (existingList.length > 0) {
        const keep = existingList[0]; // самый свежий (id desc)
        const dupIds = existingList.slice(1).map((x) => x.id);
        if (dupIds.length) {
          await deleteByIds(dupIds);
          dedupDeleted += dupIds.length;
        }

        await strapi.db.query(UID).update({
          where: { id: keep.id },
          data,
        });
        updated++;
      } else {
        await strapi.db.query(UID).create({
          data: { slug, ...data },
        });
        created++;
      }
    }

    strapi.log.info(
      `[CSV] updated=${updated} created=${created} skipped=${skipped} dedupDeleted=${dedupDeleted}`,
    );
    ctx.send({ ok: true, updated, created, skipped, dedupDeleted });
  },
};
