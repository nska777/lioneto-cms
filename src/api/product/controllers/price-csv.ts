import fs from "node:fs";
import ExcelJS from "exceljs";

const UID = "api::product.product";

const SHEET_PRODUCTS = "Products";

const PRODUCT_COLUMNS = [
  { key: "sku", header: "sku", width: 22 },
  { key: "articleShort", header: "articleShort", width: 20 },
  { key: "title", header: "title", width: 35 },
  { key: "slug", header: "slug", width: 35 },
  { key: "isActive", header: "isActive", width: 12 },
  { key: "brand", header: "brand", width: 18 },
  { key: "cat", header: "cat", width: 18 },
  { key: "module", header: "module", width: 18 },
  { key: "collection", header: "collection", width: 18 },
  { key: "collectionBadge", header: "collectionBadge", width: 22 },

  { key: "priceUZS", header: "priceUZS", width: 16 },
  { key: "priceRUB", header: "priceRUB", width: 16 },
  { key: "priceKZ", header: "priceKZ", width: 16 },
  { key: "priceTJ", header: "priceTJ", width: 16 },

  { key: "oldPriceUZS", header: "oldPriceUZS", width: 16 },
  { key: "oldPriceRUB", header: "oldPriceRUB", width: 16 },

  { key: "dealerPriceUZS", header: "dealerPriceUZS", width: 18 },
  { key: "dealerPriceRUB", header: "dealerPriceRUB", width: 18 },
  { key: "dealerPriceKZ", header: "dealerPriceKZ", width: 18 },
  { key: "dealerPriceTJ", header: "dealerPriceTJ", width: 18 },

  { key: "stockQty", header: "stockQty", width: 14 },
  { key: "reservedQty", header: "reservedQty", width: 14 },
  { key: "isStockTracked", header: "isStockTracked", width: 16 },
  { key: "isDealerActive", header: "isDealerActive", width: 16 },

  { key: "sortOrder", header: "sortOrder", width: 14 },
  { key: "color", header: "color", width: 20 },
  { key: "size", header: "size", width: 24 },
  { key: "material", header: "material", width: 24 },
  { key: "description", header: "description", width: 70 },
];

const BRAND_ENUM = new Set([
  "scandy",
  "scandi",
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

const CAT_ALIASES: Record<string, string> = {
  tumbi: "tumby",
  tumba: "tumby",
  tumby: "tumby",

  krovat: "krovati",
  krovati: "krovati",
  bed: "krovati",

  shkaf: "shkafy",
  shkafy: "shkafy",

  komod: "komody",
  komody: "komody",

  stol: "stoli",
  stoli: "stoli",

  zerkalo: "zerkala",
  zerkala: "zerkala",

  vitrina: "vitrini",
  vitrini: "vitrini",

  puf: "pufi",
  pufi: "pufi",

  polka: "polki",
  polki: "polki",

  stellaj: "stellaji",
  stellaji: "stellaji",

  "tumby-tv": "tumby",
  dekor: "fasadi",
  scene: "bedrooms",
};

const BADGE_ENUM = [
  "Хит продаж",
  "Лучшая цена",
  "Супер акция",
  "Распродажа",
  "Только сегодня",
  "Успейте купить",
];

const PLACEHOLDER_VALUES = new Set(["28", "29"]);

function cleanText(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (PLACEHOLDER_VALUES.has(s)) return "";
  return s;
}

function isBadSku(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return true;
  if (PLACEHOLDER_VALUES.has(s)) return true;
  return false;
}

function normLower(v: any) {
  return String(v ?? "").trim().toLowerCase();
}

function normalizeBrand(v: any) {
  const raw = normLower(v);
  if (!raw) return null;

  /**
   * В Strapi/Excel может быть scandi/scandy.
   * В базе бренда лучше держать scandy.
   * На фронте он нормализуется в scandi для URL/фильтров.
   */
  if (raw === "scandi") return "scandy";
  if (BRAND_ENUM.has(raw)) return raw;

  return null;
}

function normalizeCat(v: any) {
  const raw = normLower(v);
  if (!raw) return null;

  const aliased = CAT_ALIASES[raw] ?? raw;
  if (CAT_ENUM.has(aliased)) return aliased;

  return null;
}

function normalizeCollection(v: any) {
  const raw = normLower(v);
  if (!raw) return "";

  if (raw === "scandy") return "scandi";
  return raw;
}

function normalizeModule(v: any) {
  const raw = normLower(v);
  if (!raw) return "";

  if (raw === "scene") return "scene";

  return normalizeCat(raw) ?? raw;
}

function normalizeBadge(v: any) {
  const s = cleanText(v);
  if (!s) return null;

  const hit = BADGE_ENUM.find((x) => String(x).trim() === s.trim());
  return hit ?? null;
}

function toNumOrNull(v: any) {
  const s = String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .trim();

  if (!s) return null;

  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toBoolOrNull(v: any) {
  const s = String(v ?? "").trim().toLowerCase();

  if (s === "") return null;
  if (["true", "1", "yes", "да", "истина"].includes(s)) return true;
  if (["false", "0", "no", "нет", "ложь"].includes(s)) return false;

  return null;
}

function cellValueToString(v: any) {
  if (v === null || v === undefined) return "";

  if (typeof v === "object") {
    if ("text" in v) return String(v.text ?? "").trim();
    if ("result" in v) return String(v.result ?? "").trim();

    if ("richText" in v && Array.isArray(v.richText)) {
      return v.richText.map((x: any) => x.text ?? "").join("").trim();
    }
  }

  return String(v).trim();
}

function makeSlug(input: string) {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/ж/g, "zh")
    .replace(/ч/g, "ch")
    .replace(/ш/g, "sh")
    .replace(/щ/g, "sch")
    .replace(/ю/g, "yu")
    .replace(/я/g, "ya")
    .replace(/а/g, "a")
    .replace(/б/g, "b")
    .replace(/в/g, "v")
    .replace(/г/g, "g")
    .replace(/д/g, "d")
    .replace(/е/g, "e")
    .replace(/з/g, "z")
    .replace(/и/g, "i")
    .replace(/й/g, "y")
    .replace(/к/g, "k")
    .replace(/л/g, "l")
    .replace(/м/g, "m")
    .replace(/н/g, "n")
    .replace(/о/g, "o")
    .replace(/п/g, "p")
    .replace(/р/g, "r")
    .replace(/с/g, "s")
    .replace(/т/g, "t")
    .replace(/у/g, "u")
    .replace(/ф/g, "f")
    .replace(/х/g, "h")
    .replace(/ц/g, "c")
    .replace(/ы/g, "y")
    .replace(/ь/g, "")
    .replace(/ъ/g, "")
    .replace(/э/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return s || `product-${Date.now()}`;
}

function getUploadedFile(ctx: any) {
  const f1 = ctx.request?.files?.file;
  const f2 = ctx.request?.files?.files?.file;
  const raw = f1 ?? f2;

  if (!raw) return null;

  return Array.isArray(raw) ? raw[0] : raw;
}

function isSceneExcelRow(row: Record<string, string>, data: any) {
  const module = normalizeModule(row.module || data.module || "");
  const slug = String(data.slug || row.slug || "")
    .trim()
    .toLowerCase();

  return module === "scene" || slug.startsWith("scene-");
}

function forceExcelRowActive(row: Record<string, string>, data: any) {
  /**
   * ВАЖНО:
   * Любой товар, который есть в Excel, после импорта должен стать активным.
   * Иначе старый isActive:false останется в базе после update.
   */
  data.isActive = true;
  data.publishedAt = new Date();

  if (isSceneExcelRow(row, data)) {
    data.module = "scene";

    if (data.sortOrder === undefined || data.sortOrder === null) {
      data.sortOrder = -100;
    }
  }

  return data;
}

async function findProductBySkuOrSlug(sku: string, slug: string) {
  const cleanSku = String(sku ?? "").trim();
  const cleanSlug = String(slug ?? "").trim();

  if (cleanSku) {
    const bySku = await strapi.db.query(UID).findMany({
      where: { sku: cleanSku },
      select: ["id", "documentId", "sku", "slug", "publishedAt"],
      orderBy: { id: "desc" },
      limit: 1,
    });

    if (Array.isArray(bySku) && bySku.length) return bySku[0];
  }

  if (cleanSlug) {
    const bySlug = await strapi.db.query(UID).findMany({
      where: { slug: cleanSlug },
      select: ["id", "documentId", "sku", "slug", "publishedAt"],
      orderBy: { id: "desc" },
      limit: 1,
    });

    if (Array.isArray(bySlug) && bySlug.length) return bySlug[0];
  }

  return null;
}

async function deactivateProductsNotInExcel(
  processedDocumentIds: Set<string>,
  processedIds: Set<number>,
) {
  const products = await strapi.db.query(UID).findMany({
    select: ["id", "documentId", "isActive"],
    orderBy: { id: "asc" },
    limit: 10000,
  });

  let deactivated = 0;

  for (const p of products ?? []) {
    const id = Number(p.id);
    const documentId = String(p.documentId ?? "").trim();

    const wasProcessed =
      (documentId && processedDocumentIds.has(documentId)) ||
      (Number.isFinite(id) && processedIds.has(id));

    if (wasProcessed) continue;

    try {
      if (documentId) {
        await strapi.documents(UID).update({
          documentId,
          data: {
            isActive: false,
            publishedAt: null,
          },
        });
      } else {
        await strapi.db.query(UID).update({
          where: { id },
          data: {
            isActive: false,
            publishedAt: null,
          },
        });
      }

      deactivated++;
    } catch (e: any) {
      strapi.log.error(
        `[EXCEL] failed to deactivate product id=${id} documentId=${documentId}: ${
          e?.message ?? e
        }`,
      );
    }
  }

  return deactivated;
}

function rowToObject(row: ExcelJS.Row, headerMap: Map<number, string>) {
  const obj: Record<string, string> = {};

  headerMap.forEach((key, colNumber) => {
    obj[key] = cellValueToString(row.getCell(colNumber).value);
  });

  return obj;
}

function buildProductData(
  row: Record<string, string>,
  mode: "create" | "update",
) {
  const data: any = {};
  let invalid = 0;

  const sku = String(row.sku ?? "").trim();
  if (sku && !isBadSku(sku)) data.sku = sku;

  const articleShort = cleanText(row.articleShort);
  if (articleShort) data.articleShort = articleShort;

  const title = cleanText(row.title);
  if (title) data.title = title;

  const slugRaw = cleanText(row.slug);
  if (slugRaw) data.slug = makeSlug(slugRaw);
  else if (mode === "create" && title) data.slug = makeSlug(`${title}-${sku}`);

  const brandNorm = normalizeBrand(row.brand);
  const brandRaw = normLower(row.brand);

  if (brandNorm) {
    data.brand = brandNorm;
  } else if (brandRaw && !PLACEHOLDER_VALUES.has(brandRaw)) {
    invalid++;
    strapi.log.warn(`[EXCEL] invalid brand="${row.brand}" sku=${sku}`);
  }

  const catRaw = cleanText(row.cat);
  const catNorm = normalizeCat(catRaw);

  if (catNorm) {
    data.cat = catNorm;
  } else if (catRaw) {
    invalid++;
    strapi.log.warn(`[EXCEL] invalid cat="${row.cat}" sku=${sku}`);
  }

  const moduleRaw = cleanText(row.module);
  if (moduleRaw) {
    data.module = normalizeModule(moduleRaw);
  }

  const collection = normalizeCollection(row.collection);
  if (collection && !PLACEHOLDER_VALUES.has(collection)) {
    data.collection = collection;
  }

  const badgeRaw = cleanText(row.collectionBadge);
  const badgeNorm = normalizeBadge(badgeRaw);

  if (badgeNorm) {
    data.collectionBadge = badgeNorm;
  } else if (badgeRaw) {
    invalid++;
    strapi.log.warn(
      `[EXCEL] invalid collectionBadge="${row.collectionBadge}" sku=${sku}`,
    );
  }

  const color = cleanText(row.color);
  if (color) data.color = color;

  const size = cleanText(row.size);
  if (size) data.size = size;

  const material = cleanText(row.material);
  if (material) data.material = material;

  const description = cleanText(row.description);
  if (description) data.description = description;

  const boolFields = ["isStockTracked", "isDealerActive"];

  /**
   * isActive специально НЕ читаем из Excel как управляющее поле.
   * Все строки Excel активируются через forceExcelRowActive().
   * Скрытие делается только для товаров, которых нет в Excel, в replace-режиме.
   */
  for (const key of boolFields) {
    const raw = String(row[key] ?? "").trim();

    if (PLACEHOLDER_VALUES.has(raw)) continue;

    const b = toBoolOrNull(row[key]);
    if (b !== null) data[key] = b;
  }

  const numberFields = [
    "priceUZS",
    "priceRUB",
    "priceKZ",
    "priceTJ",
    "oldPriceUZS",
    "oldPriceRUB",
    "dealerPriceUZS",
    "dealerPriceRUB",
    "dealerPriceKZ",
    "dealerPriceTJ",
    "stockQty",
    "reservedQty",
    "sortOrder",
  ];

  for (const key of numberFields) {
    const raw = String(row[key] ?? "").trim();

    if (
      PLACEHOLDER_VALUES.has(raw) &&
      key !== "sortOrder" &&
      key !== "stockQty" &&
      key !== "reservedQty"
    ) {
      continue;
    }

    const n = toNumOrNull(row[key]);
    if (n !== null) data[key] = n;
  }

  return { data, invalid };
}

export default {
  async export(ctx: any) {
    const products = await strapi.db.query(UID).findMany({
      select: [
        "id",
        "documentId",
        "sku",
        "articleShort",
        "title",
        "slug",
        "isActive",
        "brand",
        "cat",
        "module",
        "collection",
        "collectionBadge",
        "priceUZS",
        "priceRUB",
        "priceKZ",
        "priceTJ",
        "oldPriceUZS",
        "oldPriceRUB",
        "dealerPriceUZS",
        "dealerPriceRUB",
        "dealerPriceKZ",
        "dealerPriceTJ",
        "stockQty",
        "reservedQty",
        "isStockTracked",
        "isDealerActive",
        "sortOrder",
        "color",
        "size",
        "material",
        "description",
      ],
      orderBy: { id: "asc" },
      limit: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Lioneto CMS";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(SHEET_PRODUCTS);
    sheet.columns = PRODUCT_COLUMNS;

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const p of products ?? []) {
      sheet.addRow({
        sku: p.sku ?? "",
        articleShort: p.articleShort ?? "",
        title: p.title ?? "",
        slug: p.slug ?? "",
        isActive: typeof p.isActive === "boolean" ? String(p.isActive) : "",
        brand: p.brand ?? "",
        cat: p.cat ?? "",
        module: p.module ?? "",
        collection: p.collection ?? "",
        collectionBadge: p.collectionBadge ?? "",

        priceUZS: p.priceUZS ?? "",
        priceRUB: p.priceRUB ?? "",
        priceKZ: p.priceKZ ?? "",
        priceTJ: p.priceTJ ?? "",

        oldPriceUZS: p.oldPriceUZS ?? "",
        oldPriceRUB: p.oldPriceRUB ?? "",

        dealerPriceUZS: p.dealerPriceUZS ?? "",
        dealerPriceRUB: p.dealerPriceRUB ?? "",
        dealerPriceKZ: p.dealerPriceKZ ?? "",
        dealerPriceTJ: p.dealerPriceTJ ?? "",

        stockQty: p.stockQty ?? "",
        reservedQty: p.reservedQty ?? "",
        isStockTracked:
          typeof p.isStockTracked === "boolean" ? String(p.isStockTracked) : "",
        isDealerActive:
          typeof p.isDealerActive === "boolean" ? String(p.isDealerActive) : "",

        sortOrder: p.sortOrder ?? "",
        color: p.color ?? "",
        size: p.size ?? "",
        material: p.material ?? "",
        description: p.description ?? "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    ctx.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    ctx.set("Content-Disposition", 'attachment; filename="lioneto-catalog.xlsx"');

    ctx.body = Buffer.from(buffer as ArrayBuffer);
  },

  async import(ctx: any) {
    try {
      const modeRaw = String(ctx.query?.mode ?? "sync").trim().toLowerCase();
      const mode = modeRaw === "replace" ? "replace" : "sync";

      const file = getUploadedFile(ctx);
      if (!file) return ctx.badRequest("Excel file is required");

      const filePath = file.filepath || file.path;
      if (!filePath) return ctx.badRequest("Uploaded file path not found");

      if (!fs.existsSync(filePath)) {
        return ctx.badRequest("Uploaded file not found");
      }

      const workbook = new ExcelJS.Workbook();

      try {
        const buffer = fs.readFileSync(filePath);

        if (!buffer || buffer.length < 100) {
          return ctx.badRequest("Excel file is empty or broken");
        }

        await workbook.xlsx.load(buffer as any);
      } catch (e: any) {
        strapi.log.error(
          `[EXCEL] failed to read uploaded Excel: ${e?.message ?? e}`,
        );

        return ctx.badRequest(
          "Не удалось прочитать Excel. Сохрани файл именно как 'Книга Excel (*.xlsx)' и загрузи заново.",
        );
      }

      const sheet = workbook.getWorksheet(SHEET_PRODUCTS) || workbook.worksheets[0];

      if (!sheet) {
        return ctx.badRequest("Products sheet not found");
      }

      const headerMap = new Map<number, string>();

      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        const key = cellValueToString(cell.value);
        if (key) headerMap.set(colNumber, key);
      });

      if (!Array.from(headerMap.values()).includes("sku")) {
        return ctx.badRequest("Column sku is required");
      }

      let updated = 0;
      let created = 0;
      let skipped = 0;
      let invalid = 0;
      let deactivated = 0;

      const errors: string[] = [];

      const processedDocumentIds = new Set<string>();
      const processedIds = new Set<number>();

      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
        try {
          const row = sheet.getRow(rowNumber);

          if (!row || row.actualCellCount === 0) {
            skipped++;
            continue;
          }

          const obj = rowToObject(row, headerMap);
          const sku = String(obj.sku ?? "").trim();

          if (isBadSku(sku)) {
            skipped++;
            continue;
          }

          const slugFromExcel = cleanText(obj.slug);
          const cleanSlug = slugFromExcel ? makeSlug(slugFromExcel) : "";

          const existing = await findProductBySkuOrSlug(sku, cleanSlug);
          const itemMode = existing ? "update" : "create";

          const built = buildProductData(obj, itemMode);
          const data = forceExcelRowActive(obj, built.data);

          invalid += built.invalid;

          if (Object.keys(data).length === 0) {
            skipped++;
            continue;
          }

          if (!existing) {
            if (!data.title) {
              invalid++;
              skipped++;
              errors.push(
                `row ${rowNumber}: title is required for new product sku=${sku}`,
              );
              continue;
            }

            if (!data.slug) {
              data.slug = makeSlug(`${data.title}-${sku}`);
            }

            if (!data.cat) {
              invalid++;
              skipped++;
              errors.push(
                `row ${rowNumber}: cat is required for new product sku=${sku}`,
              );
              continue;
            }

            let createdEntity: any = null;

            try {
              createdEntity = await strapi.documents(UID).create({
                data: {
                  ...data,
                  sku,
                  locale: "en",
                },
              });
            } catch (createError: any) {
              /**
               * Защита от дубля slug/sku:
               * иногда findProductBySkuOrSlug не успевает поймать запись,
               * а create падает из-за unique.
               */
              const fallbackExisting = await findProductBySkuOrSlug(
                sku,
                String(data.slug ?? ""),
              );

              if (!fallbackExisting) {
                throw createError;
              }

              createdEntity = await strapi.documents(UID).update({
                documentId: fallbackExisting.documentId,
                data: {
                  ...data,
                  sku,
                  locale: "en",
                },
              });
            }

            const createdDocumentId = String(
              createdEntity?.documentId ?? "",
            ).trim();
            const createdId = Number(createdEntity?.id);

            if (createdDocumentId) processedDocumentIds.add(createdDocumentId);
            if (Number.isFinite(createdId)) processedIds.add(createdId);

            created++;
            continue;
          }

          if (existing.documentId) {
            const updatedEntity = await strapi.documents(UID).update({
              documentId: existing.documentId,
              data: {
                ...data,
                sku,
                locale: "en",
              },
            });

            const updatedDocumentId = String(
              updatedEntity?.documentId ?? existing.documentId ?? "",
            ).trim();
            const updatedId = Number(updatedEntity?.id ?? existing.id);

            if (updatedDocumentId) processedDocumentIds.add(updatedDocumentId);
            if (Number.isFinite(updatedId)) processedIds.add(updatedId);
          } else {
            await strapi.db.query(UID).update({
              where: { id: existing.id },
              data: {
                ...data,
                sku,
              },
            });

            const id = Number(existing.id);
            if (Number.isFinite(id)) processedIds.add(id);
          }

          updated++;
        } catch (e: any) {
          invalid++;
          skipped++;

          const msg = e?.message ? String(e.message) : "unknown error";
          errors.push(`row ${rowNumber}: ${msg}`);
          strapi.log.error(`[EXCEL] row ${rowNumber}: ${msg}`);
        }
      }

      if (mode === "replace") {
        deactivated = await deactivateProductsNotInExcel(
          processedDocumentIds,
          processedIds,
        );

        strapi.log.info(
          `[EXCEL] replace mode: deactivated ${deactivated} products not present in Excel`,
        );
      }

      ctx.send({
        ok: true,
        mode,
        created,
        updated,
        skipped,
        invalid,
        deactivated,
        errors: errors.slice(0, 50),
      });
    } catch (e: any) {
      const message = e?.message ? String(e.message) : "Unknown import error";

      strapi.log.error(`[EXCEL] import fatal error: ${message}`);

      ctx.status = 500;
      ctx.body = {
        ok: false,
        error: {
          message,
          stack: e?.stack ? String(e.stack).slice(0, 3000) : undefined,
        },
      };
    }
  },
};