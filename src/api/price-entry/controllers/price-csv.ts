import fs from "node:fs";

const UID = "api::price-entry.price-entry";

// ✅ какие колонки будут в CSV
const CSV_HEADER = [
  "productId",
  "title",
  "collectionBadge",
  "isActive",
  "hasDiscount",
  "price_uzs",
  "price_rub",
  "old_price_uzs",
  "old_price_rub",
];

function esc(v: any) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows: any[]) {
  const lines = [CSV_HEADER.join(",")];

  for (const r of rows) {
    // ✅ Strapi (camelCase) → CSV (snake_case)
    const line = [
      r.productId ?? "",
      r.title ?? "",
      r.collectionBadge ?? "",
      r.isActive ?? "",
      r.hasDiscount ?? "",
      r.priceUZS ?? "",
      r.priceRUB ?? "",
      r.oldPriceUZS ?? "",
      r.oldPriceRUB ?? "",
    ]
      .map(esc)
      .join(",");

    lines.push(line);
  }

  return lines.join("\n");
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const header = lines[0]
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""));

  const rows: any[] = [];

  for (const line of lines.slice(1)) {
    // простой парсер под твой формат (без запятых внутри значений)
    const parts = line
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""));

    const obj: any = {};
    header.forEach((k, i) => (obj[k] = parts[i]));
    rows.push(obj);
  }

  return rows;
}

function getUploadedFile(ctx: any) {
  const raw = ctx.request?.files?.file;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

function num(v: any) {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function bool(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

export default {
  async export(ctx: any) {
    const entries = await strapi.db.query(UID).findMany({
      select: [
        "id",
        "productId",
        "title",
        "collectionBadge",
        "isActive",
        "hasDiscount",
        // ✅ реальные поля Strapi:
        "priceUZS",
        "priceRUB",
        "oldPriceUZS",
        "oldPriceRUB",
        "publishedAt",
      ],
      orderBy: { id: "asc" },
      limit: 5000,
    });

    // ✅ ДЕДУПЛИКАЦИЯ ПО productId (берём самую свежую по id)
    const map = new Map<string, any>();

    for (const e of entries) {
      const key = String(e.productId || "").trim();
      if (!key) continue;

      const prev = map.get(key);
      if (!prev || (e.id ?? 0) > (prev.id ?? 0)) map.set(key, e);
    }

    const deduped = Array.from(map.values());
    const csvData = toCsv(deduped);

    ctx.set("Content-Type", "text/csv; charset=utf-8");
    ctx.set("Content-Disposition", "attachment; filename=price-entry.csv");
    ctx.body = csvData;
  }, // ✅ ВОТ ЭТА ЗАПЯТАЯ БЫЛА ОБЯЗАТЕЛЬНА

  async import(ctx: any) {
    const file = getUploadedFile(ctx);
    if (!file) return ctx.badRequest("CSV file is required");

    const filePath = file.filepath || file.path; // v5/v4
    if (!filePath) return ctx.badRequest("Uploaded file path not found");

    const text = fs.readFileSync(filePath, "utf-8");
    const rows = parseCsv(text);
    strapi.log.info("[CSV] rows=" + rows.length);
    strapi.log.info("[CSV] first=" + JSON.stringify(rows[0]));

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const productId = String(row.productId ?? "").trim();
      if (!productId) {
        skipped++;
        continue;
      }
      
      const data: any = {
        productId,
        title: String(row.title ?? "").trim() || null,
        collectionBadge: String(row.collectionBadge ?? "").trim() || null,
        isActive:
          String(row.isActive ?? "").trim() === "" ? true : bool(row.isActive),
        hasDiscount:
          String(row.hasDiscount ?? "").trim() === ""
            ? true
            : bool(row.hasDiscount),

        // ✅ CSV snake_case → Strapi camelCase
        priceUZS: num(row.price_uzs),
        priceRUB: num(row.price_rub),

        oldPriceUZS: String(row.old_price_uzs ?? "").trim()
          ? num(row.old_price_uzs)
          : null,
        oldPriceRUB: String(row.old_price_rub ?? "").trim()
          ? num(row.old_price_rub)
          : null,

        publishedAt: new Date(), // ✅ сразу Published
      };

      const existing = await strapi.db.query(UID).findOne({
        where: { productId },
        select: ["id"],
      });

      if (existing?.id) {
        await strapi.db.query(UID).update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        await strapi.db.query(UID).create({ data });
        created++;
      }
    }
    strapi.log.info(
  `[CSV] updated=${updated} created=${created} skipped=${skipped}`
);
    ctx.send({ ok: true, updated, created, skipped });
  },
};
