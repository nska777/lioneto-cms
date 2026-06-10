import fs from "node:fs";
import ExcelJS from "exceljs";

const UID = "api::product.product";

const SHEET_PRODUCTS = "Products";
const SHEET_VARIANTS = "Variants";
const SHEET_SET_ITEMS = "SetItems";

const PRODUCT_COLUMNS = [
  { key: "sku", header: "sku", width: 22 },
  { key: "articleShort", header: "articleShort", width: 20 },
  { key: "title", header: "title", width: 35 },
  { key: "slug", header: "slug", width: 35 },
  { key: "isActive", header: "isActive", width: 12 },
  { key: "isActiveUZ", header: "isActiveUZ", width: 14 },
  { key: "isActiveRU", header: "isActiveRU", width: 14 },
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
  { key: "oldPriceKZ", header: "oldPriceKZ", width: 16 },

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

const VARIANT_COLUMNS = [
  { key: "parentSku", header: "parentSku", width: 30 },
  { key: "color", header: "color", width: 20 },
  { key: "variantKey", header: "variantKey", width: 18 },
  { key: "variantSku", header: "variantSku", width: 32 },

  { key: "priceUZS", header: "priceUZS", width: 16 },
  { key: "priceRUB", header: "priceRUB", width: 16 },
  { key: "dealerPriceUZS", header: "dealerPriceUZS", width: 18 },
  { key: "dealerPriceRUB", header: "dealerPriceRUB", width: 18 },

  { key: "oldPriceUZS", header: "oldPriceUZS", width: 16 },
  { key: "oldPriceRUB", header: "oldPriceRUB", width: 16 },

  { key: "size", header: "size", width: 24 },
  { key: "material", header: "material", width: 28 },
  { key: "description", header: "description", width: 70 },
  { key: "imageFile", header: "imageFile", width: 30 },
  { key: "sortOrder", header: "sortOrder", width: 14 },

  { key: "isActive", header: "isActive", width: 14 },
  { key: "isActiveUZ", header: "isActiveUZ", width: 14 },
  { key: "isActiveRU", header: "isActiveRU", width: 14 },
  { key: "isDealerActive", header: "isDealerActive", width: 16 },
];

const SET_ITEM_COLUMNS = [
  { key: "parentSku", header: "parentSku", width: 30 },
  { key: "itemSku", header: "itemSku", width: 24 },
  { key: "title", header: "title", width: 35 },
  { key: "slug", header: "slug", width: 35 },
  { key: "article", header: "article", width: 24 },
  { key: "quantity", header: "quantity", width: 12 },

  { key: "priceUZS", header: "priceUZS", width: 16 },
  { key: "priceRUB", header: "priceRUB", width: 16 },
  { key: "dealerPriceUZS", header: "dealerPriceUZS", width: 18 },
  { key: "dealerPriceRUB", header: "dealerPriceRUB", width: 18 },

  { key: "groupKey", header: "groupKey", width: 18 },
  { key: "groupTitle", header: "groupTitle", width: 30 },
  { key: "groupOrder", header: "groupOrder", width: 14 },
  { key: "selectionType", header: "selectionType", width: 16 },
  { key: "isRequired", header: "isRequired", width: 14 },

  { key: "itemKind", header: "itemKind", width: 18 },
  { key: "addsToArticle", header: "addsToArticle", width: 16 },
  { key: "articleJoinRule", header: "articleJoinRule", width: 18 },
  { key: "affectsImage", header: "affectsImage", width: 16 },

  { key: "colorKey", header: "colorKey", width: 16 },
  { key: "optionKey", header: "optionKey", width: 18 },

  { key: "imageFile", header: "imageFile", width: 34 },
  { key: "assembledImageFile", header: "assembledImageFile", width: 36 },

  { key: "sortOrder", header: "sortOrder", width: 14 },

  { key: "isActive", header: "isActive", width: 14 },
  { key: "isActiveUZ", header: "isActiveUZ", width: 14 },
  { key: "isActiveRU", header: "isActiveRU", width: 14 },
  { key: "isDealerActive", header: "isDealerActive", width: 16 },

  { key: "note", header: "note", width: 50 },
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
  "tumba-tv": "tumby",
  "tumby-tv": "tumby",

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

function cleanLongText(v: any, max = 5000) {
  const s = cleanText(v);
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
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
  if (PLACEHOLDER_VALUES.has(s)) return null;

  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toBoolOrNull(v: any) {
  const s = String(v ?? "").trim().toLowerCase();

  if (s === "") return null;
  if (PLACEHOLDER_VALUES.has(s)) return null;

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

function applyExcelPublicationState(row: Record<string, string>, data: any) {
  const active = toBoolOrNull(row.isActive);

  if (active !== null) {
    data.isActive = active;
  }

  if (data.isActive === false) {
    data.publishedAt = null;
  } else {
    if (data.isActive === undefined || data.isActive === null) {
      data.isActive = true;
    }

    data.publishedAt = new Date();
  }

  if (isSceneExcelRow(row, data)) {
    data.module = "scene";

    if (data.sortOrder === undefined || data.sortOrder === null) {
      data.sortOrder = -100;
    }
  }

  return data;
}

async function unpublishProductIfPossible(product: any) {
  const documentId = String(product?.documentId ?? "").trim();

  if (!documentId) return;

  try {
    await strapi.documents(UID).unpublish({
      documentId,
    } as any);
  } catch (e: any) {
    strapi.log.warn(
      `[EXCEL] failed to unpublish product documentId=${documentId}: ${
        e?.message ?? e
      }`,
    );
  }
}

/**
 * ВАЖНО:
 * Не считаем товар скрытым только потому, что isActiveRU=false.
 * У нас RU может быть выключен, а UZ включен.
 */
function isParentGloballyHidden(product: any) {
  if (product?.isActive === false) return true;

  const uz = product?.isActiveUZ;
  const ru = product?.isActiveRU;

  if (uz === false && ru === false) return true;

  return false;
}

async function findProductBySkuOrSlug(sku: string, slug: string) {
  const cleanSku = String(sku ?? "").trim();
  const cleanSlug = String(slug ?? "").trim();

  const select = [
    "id",
    "documentId",
    "sku",
    "slug",
    "publishedAt",
    "isActive",
    "isActiveUZ",
    "isActiveRU",
    "priceUZS",
    "priceRUB",
  ];

  if (cleanSku) {
    const bySku = await strapi.db.query(UID).findMany({
      where: { sku: cleanSku },
      select,
      orderBy: { id: "desc" },
      limit: 1,
    });

    if (Array.isArray(bySku) && bySku.length) return bySku[0];
  }

  if (cleanSlug) {
    const bySlug = await strapi.db.query(UID).findMany({
      where: { slug: cleanSlug },
      select,
      orderBy: { id: "desc" },
      limit: 1,
    });

    if (Array.isArray(bySlug) && bySlug.length) return bySlug[0];
  }

  return null;
}

async function findProductBySku(sku: string) {
  const cleanSku = String(sku ?? "").trim();
  if (!cleanSku) return null;

  const bySku = await strapi.db.query(UID).findMany({
    where: { sku: cleanSku },
    select: [
      "id",
      "documentId",
      "sku",
      "slug",
      "publishedAt",
      "isActive",
      "isActiveUZ",
      "isActiveRU",
      "priceUZS",
      "priceRUB",
    ],
    orderBy: { id: "desc" },
    limit: 1,
  });

  if (Array.isArray(bySku) && bySku.length) return bySku[0];

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
          status: "draft",
        } as any);

        await unpublishProductIfPossible({ documentId });
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

function buildHeaderMap(sheet: ExcelJS.Worksheet) {
  const headerMap = new Map<number, string>();

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const key = cellValueToString(cell.value);
    if (key) headerMap.set(colNumber, key);
  });

  return headerMap;
}

function getWorksheetLoose(workbook: ExcelJS.Workbook, name: string) {
  const target = String(name).trim().toLowerCase();

  return (
    workbook.getWorksheet(name) ||
    workbook.worksheets.find(
      (s) => String(s.name ?? "").trim().toLowerCase() === target,
    ) ||
    null
  );
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

  const active = toBoolOrNull(row.isActive);
  if (active !== null) data.isActive = active;
  else if (mode === "create") data.isActive = true;

  const activeUZ = toBoolOrNull(row.isActiveUZ);
  if (activeUZ !== null) data.isActiveUZ = activeUZ;
  else if (mode === "create") data.isActiveUZ = true;

  const activeRU = toBoolOrNull(row.isActiveRU);
  if (activeRU !== null) data.isActiveRU = activeRU;
  else if (mode === "create") data.isActiveRU = false;

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

  const description = cleanLongText(row.description, 5000);
  if (description) data.description = description;

  const boolFields = ["isStockTracked", "isDealerActive"];

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
    "oldPriceKZ",
    "dealerPriceUZS",
    "dealerPriceRUB",
    "dealerPriceKZ",
    "dealerPriceTJ",
    "stockQty",
    "reservedQty",
    "sortOrder",
  ];

  for (const key of numberFields) {
    const n = toNumOrNull(row[key]);
    if (n !== null) data[key] = n;
  }

  return { data, invalid };
}

function normalizeFileName(v: any) {
  return (
    String(v ?? "")
      .trim()
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      ?.trim()
      .toLowerCase() || ""
  );
}

function fileNameWithoutExt(v: string) {
  return String(v || "")
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase();
}

async function loadMediaFiles() {
  try {
    const files = await strapi.db.query("plugin::upload.file").findMany({
      select: ["id", "name", "url", "hash", "ext"],
      orderBy: { id: "desc" },
      limit: 10000,
    });

    return Array.isArray(files) ? files : [];
  } catch (e: any) {
    strapi.log.error(`[EXCEL] failed to load Media Library: ${e?.message ?? e}`);
    return [];
  }
}

function findMediaByImageFile(mediaFiles: any[], imageFile: string) {
  const wanted = normalizeFileName(imageFile);
  if (!wanted) return null;

  const wantedNoExt = fileNameWithoutExt(wanted);

  for (const f of mediaFiles) {
    const id = Number(f?.id);
    if (!Number.isFinite(id)) continue;

    const name = normalizeFileName(f?.name);
    const url = normalizeFileName(f?.url);
    const hash = String(f?.hash ?? "").trim().toLowerCase();
    const ext = String(f?.ext ?? "").trim().toLowerCase();
    const hashWithExt = `${hash}${ext}`.toLowerCase();

    if (name && name === wanted) return f;
    if (url && url === wanted) return f;
    if (hashWithExt && hashWithExt === wanted) return f;
    if (hash && hash === wantedNoExt) return f;
  }

  return null;
}

function buildVariantKey(color: string, rawKey: string) {
  const fromExcel = cleanText(rawKey);
  if (fromExcel) return makeSlug(fromExcel);

  return makeSlug(color);
}

function buildVariantData({
  row,
  mediaFiles,
}: {
  row: Record<string, string>;
  mediaFiles: any[];
}) {
  const color = cleanText(row.color);

  if (!color) {
    return {
      ok: false,
      reason: "color is required",
      data: null,
      mediaMissing: false,
    };
  }

  const active = toBoolOrNull(row.isActive);

  if (active === false) {
    return {
      ok: false,
      reason: "variant is inactive",
      data: null,
      mediaMissing: false,
    };
  }

  const variantKey = buildVariantKey(color, row.variantKey);
  const variantSku = cleanText(row.variantSku);

  const finalUZS = toNumOrNull(row.priceUZS);
  const finalRUB = toNumOrNull(row.priceRUB);
  const dealerUZS = toNumOrNull(row.dealerPriceUZS);
  const dealerRUB = toNumOrNull(row.dealerPriceRUB);
  const oldUZS = toNumOrNull(row.oldPriceUZS);
  const oldRUB = toNumOrNull(row.oldPriceRUB);

  const activeUZ = toBoolOrNull(row.isActiveUZ);
  const activeRU = toBoolOrNull(row.isActiveRU);
  const dealerActive = toBoolOrNull(row.isDealerActive);

  const data: any = {
    title: color,
    type: "color",
    group: "color",
    variantKey,
  };

  if (variantSku) {
    data.variantSku = variantSku;
  }

  if (activeUZ !== null) data.isActiveUZ = activeUZ;
  else data.isActiveUZ = true;

  if (activeRU !== null) data.isActiveRU = activeRU;
  else data.isActiveRU = false;

  if (dealerActive !== null) data.isDealerActive = dealerActive;
  else data.isDealerActive = true;

  /**
   * priceDeltaUZS / priceDeltaRUB используются как ИТОГОВАЯ цена варианта,
   * а не как доплата.
   */
  if (finalUZS !== null) data.priceDeltaUZS = Math.round(finalUZS);
  if (finalRUB !== null) data.priceDeltaRUB = Math.round(finalRUB);

  if (oldUZS !== null) data.oldPriceUZS = Math.round(oldUZS);
  if (oldRUB !== null) data.oldPriceRUB = Math.round(oldRUB);

  if (dealerUZS !== null) data.dealerPriceUZS = Math.round(dealerUZS);
  if (dealerRUB !== null) data.dealerPriceRUB = Math.round(dealerRUB);

  const imageFile = cleanText(row.imageFile);
  let mediaMissing = false;

  if (imageFile) {
    const media = findMediaByImageFile(mediaFiles, imageFile);

    if (media?.id) {
      data.image = Number(media.id);
    } else {
      mediaMissing = true;
      strapi.log.warn(
        `[EXCEL] variant image not found in Media Library: "${imageFile}" parentSku="${row.parentSku}" color="${color}"`,
      );
    }
  }

  return {
    ok: true,
    reason: "",
    data,
    mediaMissing,
  };
}

async function importVariantsFromWorkbook(workbook: ExcelJS.Workbook) {
  const result = {
    rows: 0,
    updatedProducts: 0,
    skippedRows: 0,
    mediaMissing: 0,
    errors: [] as string[],
  };

  const sheet = getWorksheetLoose(workbook, SHEET_VARIANTS);

  if (!sheet) {
    strapi.log.warn("[EXCEL] Variants sheet not found");
    return result;
  }

  const headerMap = buildHeaderMap(sheet);
  const headers = Array.from(headerMap.values());

  if (!headers.includes("parentSku")) {
    result.errors.push("Variants sheet: column parentSku is required");
    return result;
  }

  if (!headers.includes("color")) {
    result.errors.push("Variants sheet: column color is required");
    return result;
  }

  const mediaFiles = await loadMediaFiles();
  const grouped = new Map<string, Record<string, string>[]>();

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);

    if (!row || row.actualCellCount === 0) {
      result.skippedRows++;
      continue;
    }

    const obj = rowToObject(row, headerMap);
    const parentSku = String(obj.parentSku ?? "").trim();
    const color = cleanText(obj.color);

    if (isBadSku(parentSku)) {
      result.skippedRows++;
      continue;
    }

    if (!color) {
      result.skippedRows++;
      continue;
    }

    result.rows++;

    const list = grouped.get(parentSku) ?? [];
    list.push(obj);
    grouped.set(parentSku, list);
  }

  for (const [parentSku, rows] of grouped.entries()) {
    try {
      const parentProduct = await findProductBySku(parentSku);

      if (!parentProduct) {
        result.errors.push(`Variants: parent product not found sku=${parentSku}`);
        continue;
      }

      if (isParentGloballyHidden(parentProduct)) {
        result.skippedRows += rows.length;
        await unpublishProductIfPossible(parentProduct);
        continue;
      }

      const variants: any[] = [];

      const sortedRows = [...rows].sort((a, b) => {
        const sa = toNumOrNull(a.sortOrder) ?? 999999;
        const sb = toNumOrNull(b.sortOrder) ?? 999999;

        if (sa !== sb) return sa - sb;

        return String(a.color ?? "").localeCompare(String(b.color ?? ""), "ru");
      });

      for (const row of sortedRows) {
        const built = buildVariantData({
          row,
          mediaFiles,
        });

        if (built.mediaMissing) result.mediaMissing++;

        if (!built.ok || !built.data) {
          result.skippedRows++;
          continue;
        }

        variants.push(built.data);
      }

      if (!variants.length) {
        result.skippedRows += rows.length;
        continue;
      }

      if (parentProduct.documentId) {
        await strapi.documents(UID).update({
          documentId: parentProduct.documentId,
          data: {
            variants,
          },
          status: "published",
        } as any);
      } else {
        await strapi.db.query(UID).update({
          where: { id: parentProduct.id },
          data: {
            variants,
          },
        });
      }

      result.updatedProducts++;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "unknown error";

      result.errors.push(`Variants sku=${parentSku}: ${msg}`);
      strapi.log.error(`[EXCEL] variants sku=${parentSku}: ${msg}`);

      if (e?.details) {
        strapi.log.error(
          `[EXCEL] variants details sku=${parentSku}: ${JSON.stringify(
            e.details,
          )}`,
        );
      }
    }
  }

  return result;
}

function normalizeSelectionType(v: any) {
  const s = normLower(v);
  if (s === "multiple") return "multiple";
  return "single";
}

function buildSetItemData({
  row,
  mediaFiles,
  index,
}: {
  row: Record<string, string>;
  mediaFiles: any[];
  index: number;
}) {
  const title = cleanText(row.title);
  const itemSku = cleanText(row.itemSku);
  const article = cleanText(row.article) || itemSku;
  const slugRaw = cleanText(row.slug);
  const quantity = toNumOrNull(row.quantity) ?? 1;

  const priceUZS = toNumOrNull(row.priceUZS);
  const priceRUB = toNumOrNull(row.priceRUB);
  const dealerPriceUZS = toNumOrNull(row.dealerPriceUZS);
  const dealerPriceRUB = toNumOrNull(row.dealerPriceRUB);

  const sortOrder = toNumOrNull(row.sortOrder) ?? index + 1;
  const groupOrder = toNumOrNull(row.groupOrder) ?? 999;

  const note = cleanText(row.note);

  const groupKeyRaw = cleanText(row.groupKey);
  const groupTitle = cleanText(row.groupTitle);

  const colorKeyRaw = cleanText(row.colorKey);
  const optionKeyRaw = cleanText(row.optionKey);

  const groupKey = groupKeyRaw ? makeSlug(groupKeyRaw) : "default";
  const colorKey = colorKeyRaw ? makeSlug(colorKeyRaw) : "";
  const optionKey = optionKeyRaw ? makeSlug(optionKeyRaw) : "";

  const selectionType = normalizeSelectionType(row.selectionType);
  const isRequired = toBoolOrNull(row.isRequired);
  const addsToArticle = toBoolOrNull(row.addsToArticle);
  const affectsImage = toBoolOrNull(row.affectsImage);

  const itemKind = cleanText(row.itemKind);
  const articleJoinRule = cleanText(row.articleJoinRule);

  if (!title && !itemSku && !article) {
    return {
      ok: false,
      reason: "empty set item",
      data: null,
      mediaMissing: false,
    };
  }

  const active = toBoolOrNull(row.isActive);
  if (active === false) {
    return {
      ok: false,
      reason: "set item inactive",
      data: null,
      mediaMissing: false,
    };
  }

  let mediaMissing = false;
  let image = "";
  let assembledImage = "";

  const imageFile = cleanText(row.imageFile);
  if (imageFile) {
    const media = findMediaByImageFile(mediaFiles, imageFile);

    if (media?.url) {
      image = String(media.url);
    } else {
      mediaMissing = true;
      strapi.log.warn(
        `[EXCEL] set item image not found in Media Library: "${imageFile}" parentSku="${row.parentSku}" itemSku="${itemSku}"`,
      );
    }
  }

  const assembledImageFile = cleanText(row.assembledImageFile);
  if (assembledImageFile) {
    const media = findMediaByImageFile(mediaFiles, assembledImageFile);

    if (media?.url) {
      assembledImage = String(media.url);
    } else {
      mediaMissing = true;
      strapi.log.warn(
        `[EXCEL] set item assembled image not found in Media Library: "${assembledImageFile}" parentSku="${row.parentSku}" itemSku="${itemSku}"`,
      );
    }
  }

  const baseId = itemSku || article || slugRaw || makeSlug(title);
  const idParts = [groupKey, baseId, colorKey, optionKey].filter(Boolean);
  const id = idParts.join("-");

  const activeUZ = toBoolOrNull(row.isActiveUZ);
  const activeRU = toBoolOrNull(row.isActiveRU);
  const dealerActive = toBoolOrNull(row.isDealerActive);

  const data: any = {
    id,
    title: title || itemSku || article || "Без названия",
    article: article || undefined,
    slug: slugRaw ? makeSlug(slugRaw) : undefined,
    quantity: Math.max(1, quantity),
    sort_order: sortOrder,

    groupKey,
    groupTitle: groupTitle || groupKey,
    groupOrder,

    selectionType,
    isRequired: isRequired ?? false,

    isActive: active ?? true,
  };

  if (itemKind) data.itemKind = itemKind;

  if (addsToArticle !== null) data.addsToArticle = addsToArticle;
  else data.addsToArticle = true;

  if (articleJoinRule) data.articleJoinRule = articleJoinRule;
  else data.articleJoinRule = "plus";

  if (affectsImage !== null) data.affectsImage = affectsImage;
  else data.affectsImage = true;

  if (activeUZ !== null) data.isActiveUZ = activeUZ;
  else data.isActiveUZ = true;

  if (activeRU !== null) data.isActiveRU = activeRU;
  else data.isActiveRU = false;

  if (dealerActive !== null) data.isDealerActive = dealerActive;
  else data.isDealerActive = true;

  if (priceUZS !== null) data.price_uzs = priceUZS;
  if (priceRUB !== null) data.price_rub = priceRUB;

  if (dealerPriceUZS !== null) data.dealer_price_uzs = dealerPriceUZS;
  if (dealerPriceRUB !== null) data.dealer_price_rub = dealerPriceRUB;

  if (image) data.image = image;
  if (assembledImage) data.assembledImage = assembledImage;

  if (colorKey) data.colorKey = colorKey;
  if (optionKey) data.optionKey = optionKey;
  if (note) data.note = note;

  return {
    ok: true,
    reason: "",
    data,
    mediaMissing,
  };
}

async function importSetItemsFromWorkbook(workbook: ExcelJS.Workbook) {
  const result = {
    rows: 0,
    updatedProducts: 0,
    skippedRows: 0,
    mediaMissing: 0,
    errors: [] as string[],
  };

  const sheet = getWorksheetLoose(workbook, SHEET_SET_ITEMS);

  if (!sheet) {
    strapi.log.warn("[EXCEL] SetItems sheet not found");
    return result;
  }

  const headerMap = buildHeaderMap(sheet);
  const headers = Array.from(headerMap.values());

  if (!headers.includes("parentSku")) {
    result.errors.push("SetItems sheet: column parentSku is required");
    return result;
  }

  if (!headers.includes("title") && !headers.includes("itemSku")) {
    result.errors.push("SetItems sheet: column title or itemSku is required");
    return result;
  }

  const mediaFiles = await loadMediaFiles();
  const grouped = new Map<string, Record<string, string>[]>();

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);

    if (!row || row.actualCellCount === 0) {
      result.skippedRows++;
      continue;
    }

    const obj = rowToObject(row, headerMap);
    const parentSku = String(obj.parentSku ?? "").trim();

    if (isBadSku(parentSku)) {
      result.skippedRows++;
      continue;
    }

    result.rows++;

    const list = grouped.get(parentSku) ?? [];
    list.push(obj);
    grouped.set(parentSku, list);
  }

  for (const [parentSku, rows] of grouped.entries()) {
    try {
      const parentProduct = await findProductBySku(parentSku);

      if (!parentProduct) {
        result.errors.push(`SetItems: parent product not found sku=${parentSku}`);
        continue;
      }

      if (isParentGloballyHidden(parentProduct)) {
        result.skippedRows += rows.length;
        await unpublishProductIfPossible(parentProduct);
        continue;
      }

      const setItems: any[] = [];

      const sortedRows = [...rows].sort((a, b) => {
        const ga = toNumOrNull(a.groupOrder) ?? 999;
        const gb = toNumOrNull(b.groupOrder) ?? 999;

        if (ga !== gb) return ga - gb;

        const gka = cleanText(a.groupKey);
        const gkb = cleanText(b.groupKey);

        if (gka !== gkb) return gka.localeCompare(gkb, "ru");

        const ca = cleanText(a.colorKey);
        const cb = cleanText(b.colorKey);

        if (ca !== cb) return ca.localeCompare(cb, "ru");

        const oa = cleanText(a.optionKey);
        const ob = cleanText(b.optionKey);

        if (oa !== ob) return oa.localeCompare(ob, "ru");

        const sa = toNumOrNull(a.sortOrder) ?? 999999;
        const sb = toNumOrNull(b.sortOrder) ?? 999999;

        if (sa !== sb) return sa - sb;

        return String(a.title ?? "").localeCompare(String(b.title ?? ""), "ru");
      });

      for (let i = 0; i < sortedRows.length; i++) {
        const row = sortedRows[i];

        const built = buildSetItemData({
          row,
          mediaFiles,
          index: i,
        });

        if (built.mediaMissing) result.mediaMissing++;

        if (!built.ok || !built.data) {
          result.skippedRows++;
          continue;
        }

        setItems.push(built.data);
      }

      if (!setItems.length) {
        result.skippedRows += rows.length;
        continue;
      }

      if (parentProduct.documentId) {
        await strapi.documents(UID).update({
          documentId: parentProduct.documentId,
          data: {
            set_items_json: setItems,
          },
          status: "published",
        } as any);
      } else {
        await strapi.db.query(UID).update({
          where: { id: parentProduct.id },
          data: {
            set_items_json: setItems,
          },
        });
      }

      result.updatedProducts++;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "unknown error";

      result.errors.push(`SetItems sku=${parentSku}: ${msg}`);
      strapi.log.error(`[EXCEL] setItems sku=${parentSku}: ${msg}`);

      if (e?.details) {
        strapi.log.error(
          `[EXCEL] setItems details sku=${parentSku}: ${JSON.stringify(
            e.details,
          )}`,
        );
      }
    }
  }

  return result;
}

export default {
  async export(ctx: any) {
    const rawProducts = await strapi.db.query(UID).findMany({
      select: [
        "id",
        "documentId",
        "publishedAt",
        "updatedAt",
        "sku",
        "articleShort",
        "title",
        "slug",
        "isActive",
        "isActiveUZ",
        "isActiveRU",
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
        "oldPriceKZ",
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
        "set_items_json",
      ],
      populate: {
        variants: {
          populate: {
            image: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      limit: 10000,
    });

    const productMap = new Map<string, any>();
    let duplicateProductsSkipped = 0;

    for (const p of rawProducts ?? []) {
      /**
       * В Strapi 5 db.query может вернуть несколько физических строк одного товара:
       * draft/published версии, а иногда и старые document-дубли после импортов.
       * Для Excel главным ключом является sku, поэтому дедублируем СНАЧАЛА по sku.
       * documentId оставляем только как запасной ключ, если sku пустой.
       */
      const skuKey = String(p?.sku ?? "").trim();
      const slugKey = String(p?.slug ?? "").trim();
      const documentKey = String(p?.documentId ?? "").trim();

      const key = skuKey || slugKey || documentKey || String(p?.id ?? "").trim();

      if (!key) continue;

      const existing = productMap.get(key);

      if (!existing) {
        productMap.set(key, p);
        continue;
      }

      duplicateProductsSkipped++;

      const existingPublished = Boolean(existing?.publishedAt);
      const currentPublished = Boolean(p?.publishedAt);

      if (!existingPublished && currentPublished) {
        productMap.set(key, p);
        continue;
      }

      if (existingPublished === currentPublished) {
        const existingUpdated = new Date(existing?.updatedAt ?? 0).getTime();
        const currentUpdated = new Date(p?.updatedAt ?? 0).getTime();

        if (currentUpdated > existingUpdated) {
          productMap.set(key, p);
        }
      }
    }

    const BRAND_ORDER = [
      "amber",
      "scandy",
      "elizabeth",
      "salvador",
      "pitti",
      "buongiorno",
    ];

    function sortText(v: any) {
      return String(v ?? "").trim().toLowerCase();
    }

    function sortNumber(v: any) {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : 999999;
    }

    function normalizeExportBrand(v: any) {
      const brand = sortText(v);

      if (brand === "scandi") return "scandy";
      if (brand === "scandy") return "scandy";

      return brand;
    }

    function exportBrandIndex(v: any) {
      const brand = normalizeExportBrand(v);
      const index = BRAND_ORDER.indexOf(brand);
      return index >= 0 ? index : 999;
    }

    function isSceneExportProduct(product: any) {
      return (
        sortText(product?.module) === "scene" ||
        sortText(product?.slug).startsWith("scene-") ||
        sortText(product?.sku).startsWith("scene-")
      );
    }

    const products = Array.from(productMap.values()).sort((a: any, b: any) => {
      const aScene = isSceneExportProduct(a);
      const bScene = isSceneExportProduct(b);

      // 1) Сначала карточки коллекций / scene наверху.
      if (aScene && !bScene) return -1;
      if (!aScene && bScene) return 1;

      // 2) Дальше товары идут друг за другом по бренду.
      const byBrand = exportBrandIndex(a?.brand) - exportBrandIndex(b?.brand);
      if (byBrand !== 0) return byBrand;

      // 3) Внутри бренда сохраняем обычный порядок через sortOrder.
      const bySortOrder = sortNumber(a?.sortOrder) - sortNumber(b?.sortOrder);
      if (bySortOrder !== 0) return bySortOrder;

      // 4) Остальное — стабильная сортировка, чтобы файл не прыгал от выгрузки к выгрузке.
      const byTitle = sortText(a?.title).localeCompare(sortText(b?.title), "ru");
      if (byTitle !== 0) return byTitle;

      const bySku = sortText(a?.sku).localeCompare(sortText(b?.sku), "ru");
      if (bySku !== 0) return bySku;

      return Number(a?.id ?? 0) - Number(b?.id ?? 0);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Lioneto CMS";
    workbook.created = new Date();

    const productSheet = workbook.addWorksheet(SHEET_PRODUCTS);
    productSheet.columns = PRODUCT_COLUMNS;
    productSheet.getRow(1).font = { bold: true };
    productSheet.views = [{ state: "frozen", ySplit: 1 }];

    const variantSheet = workbook.addWorksheet(SHEET_VARIANTS);
    variantSheet.columns = VARIANT_COLUMNS;
    variantSheet.getRow(1).font = { bold: true };
    variantSheet.views = [{ state: "frozen", ySplit: 1 }];

    const setItemsSheet = workbook.addWorksheet(SHEET_SET_ITEMS);
    setItemsSheet.columns = SET_ITEM_COLUMNS;
    setItemsSheet.getRow(1).font = { bold: true };
    setItemsSheet.views = [{ state: "frozen", ySplit: 1 }];

    function boolToExcel(v: any) {
      return typeof v === "boolean" ? String(v) : "";
    }

    function valueOrEmpty(v: any) {
      if (v === null || v === undefined) return "";
      return v;
    }

    function mediaToFileName(media: any) {
      if (!media) return "";

      if (typeof media === "string") {
        return media.replace(/\\/g, "/").split("/").pop() || "";
      }

      const direct =
        media.name ||
        media.fileName ||
        media.url ||
        media.hash ||
        media.data?.attributes?.name ||
        media.data?.attributes?.url ||
        "";

      return String(direct || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    }

    function normalizeSetItems(raw: any): any[] {
      if (!raw) return [];

      if (Array.isArray(raw)) return raw;

      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }

      return [];
    }

    function getSetItemValue(item: any, keys: string[]) {
      for (const key of keys) {
        const value = item?.[key];

        if (value !== null && value !== undefined && value !== "") {
          return value;
        }
      }

      return "";
    }

    let exportedProducts = 0;
    let exportedVariants = 0;
    let exportedSetItems = 0;

    for (const p of products ?? []) {
      const parentSku = String(p.sku ?? "").trim();
      if (!parentSku) continue;

      productSheet.addRow({
        sku: parentSku,
        articleShort: valueOrEmpty(p.articleShort),
        title: valueOrEmpty(p.title),
        slug: valueOrEmpty(p.slug),

        isActive: boolToExcel(p.isActive),
        isActiveUZ: boolToExcel(p.isActiveUZ),
        isActiveRU: boolToExcel(p.isActiveRU),

        brand: valueOrEmpty(p.brand),
        cat: valueOrEmpty(p.cat),
        module: valueOrEmpty(p.module),
        collection: valueOrEmpty(p.collection),
        collectionBadge: valueOrEmpty(p.collectionBadge),

        priceUZS: valueOrEmpty(p.priceUZS),
        priceRUB: valueOrEmpty(p.priceRUB),
        priceKZ: valueOrEmpty(p.priceKZ),
        priceTJ: valueOrEmpty(p.priceTJ),

        oldPriceUZS: valueOrEmpty(p.oldPriceUZS),
        oldPriceRUB: valueOrEmpty(p.oldPriceRUB),
        oldPriceKZ: valueOrEmpty(p.oldPriceKZ),

        dealerPriceUZS: valueOrEmpty(p.dealerPriceUZS),
        dealerPriceRUB: valueOrEmpty(p.dealerPriceRUB),
        dealerPriceKZ: valueOrEmpty(p.dealerPriceKZ),
        dealerPriceTJ: valueOrEmpty(p.dealerPriceTJ),

        stockQty: valueOrEmpty(p.stockQty),
        reservedQty: valueOrEmpty(p.reservedQty),
        isStockTracked: boolToExcel(p.isStockTracked),
        isDealerActive: boolToExcel(p.isDealerActive),

        sortOrder: valueOrEmpty(p.sortOrder),
        color: valueOrEmpty(p.color),
        size: valueOrEmpty(p.size),
        material: valueOrEmpty(p.material),
        description: valueOrEmpty(p.description),
      });

      exportedProducts++;

      const variants = Array.isArray(p.variants) ? p.variants : [];

      const sortedVariants = [...variants].sort((a: any, b: any) => {
        const sa = Number(a?.sortOrder ?? 999999);
        const sb = Number(b?.sortOrder ?? 999999);

        if (sa !== sb) return sa - sb;

        return String(a?.title ?? "").localeCompare(
          String(b?.title ?? ""),
          "ru",
        );
      });

      for (const variant of sortedVariants) {
        if (!variant) continue;

        const color = variant.title || variant.color || "";
        if (!color) continue;

        variantSheet.addRow({
          parentSku,
          color,
          variantKey: valueOrEmpty(variant.variantKey),
          variantSku: valueOrEmpty(variant.variantSku),

          /**
           * ВАЖНО:
           * priceDeltaUZS / priceDeltaRUB у нас используются как финальные цены варианта,
           * не как доплата.
           */
          priceUZS: valueOrEmpty(variant.priceDeltaUZS),
          priceRUB: valueOrEmpty(variant.priceDeltaRUB),

          dealerPriceUZS: valueOrEmpty(variant.dealerPriceUZS),
          dealerPriceRUB: valueOrEmpty(variant.dealerPriceRUB),

          oldPriceUZS: valueOrEmpty(variant.oldPriceUZS),
          oldPriceRUB: valueOrEmpty(variant.oldPriceRUB),

          size: valueOrEmpty(variant.size),
          material: valueOrEmpty(variant.material),
          description: valueOrEmpty(variant.description),
          imageFile: mediaToFileName(variant.image),

          sortOrder: valueOrEmpty(variant.sortOrder),

          isActive: boolToExcel(
            typeof variant.isActive === "boolean" ? variant.isActive : true,
          ),
          isActiveUZ: boolToExcel(variant.isActiveUZ),
          isActiveRU: boolToExcel(variant.isActiveRU),
          isDealerActive: boolToExcel(variant.isDealerActive),
        });

        exportedVariants++;
      }

      const setItems = normalizeSetItems(p.set_items_json);

      const sortedSetItems = [...setItems].sort((a: any, b: any) => {
        const ga = Number(a?.groupOrder ?? a?.group_order ?? 999);
        const gb = Number(b?.groupOrder ?? b?.group_order ?? 999);

        if (ga !== gb) return ga - gb;

        const gka = String(a?.groupKey ?? "");
        const gkb = String(b?.groupKey ?? "");

        if (gka !== gkb) return gka.localeCompare(gkb, "ru");

        const ca = String(a?.colorKey ?? "");
        const cb = String(b?.colorKey ?? "");

        if (ca !== cb) return ca.localeCompare(cb, "ru");

        const oa = String(a?.optionKey ?? "");
        const ob = String(b?.optionKey ?? "");

        if (oa !== ob) return oa.localeCompare(ob, "ru");

        const sa = Number(a?.sort_order ?? a?.sortOrder ?? 999999);
        const sb = Number(b?.sort_order ?? b?.sortOrder ?? 999999);

        if (sa !== sb) return sa - sb;

        return String(a?.title ?? "").localeCompare(
          String(b?.title ?? ""),
          "ru",
        );
      });

      for (const item of sortedSetItems) {
        if (!item) continue;

        setItemsSheet.addRow({
          parentSku,

          itemSku: getSetItemValue(item, ["itemSku", "sku"]),
          title: getSetItemValue(item, ["title"]),
          slug: getSetItemValue(item, ["slug"]),
          article: getSetItemValue(item, ["article"]),
          quantity: getSetItemValue(item, ["quantity"]),

          priceUZS: getSetItemValue(item, ["priceUZS", "price_uzs"]),
          priceRUB: getSetItemValue(item, ["priceRUB", "price_rub"]),
          dealerPriceUZS: getSetItemValue(item, [
            "dealerPriceUZS",
            "dealer_price_uzs",
          ]),
          dealerPriceRUB: getSetItemValue(item, [
            "dealerPriceRUB",
            "dealer_price_rub",
          ]),

          groupKey: getSetItemValue(item, ["groupKey", "group_key"]),
          groupTitle: getSetItemValue(item, ["groupTitle", "group_title"]),
          groupOrder: getSetItemValue(item, ["groupOrder", "group_order"]),
          selectionType: getSetItemValue(item, [
            "selectionType",
            "selection_type",
          ]),
          isRequired: boolToExcel(item.isRequired),

          itemKind: getSetItemValue(item, ["itemKind", "item_kind"]),
          addsToArticle: boolToExcel(item.addsToArticle),
          articleJoinRule: getSetItemValue(item, [
            "articleJoinRule",
            "article_join_rule",
          ]),
          affectsImage: boolToExcel(item.affectsImage),

          colorKey: getSetItemValue(item, ["colorKey", "color_key"]),
          optionKey: getSetItemValue(item, ["optionKey", "option_key"]),

          imageFile: mediaToFileName(getSetItemValue(item, ["image"])),
          assembledImageFile: mediaToFileName(
            getSetItemValue(item, ["assembledImage", "assembled_image"]),
          ),

          sortOrder: getSetItemValue(item, ["sortOrder", "sort_order"]),

          isActive: boolToExcel(
            typeof item.isActive === "boolean" ? item.isActive : true,
          ),
          isActiveUZ: boolToExcel(item.isActiveUZ),
          isActiveRU: boolToExcel(item.isActiveRU),
          isDealerActive: boolToExcel(item.isDealerActive),

          note: getSetItemValue(item, ["note"]),
        });

        exportedSetItems++;
      }
    }

    productSheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: PRODUCT_COLUMNS.length,
      },
    };

    variantSheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: VARIANT_COLUMNS.length,
      },
    };

    setItemsSheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: SET_ITEM_COLUMNS.length,
      },
    };

    strapi.log.info(
      `[EXCEL] export done: rawProducts=${Array.isArray(rawProducts) ? rawProducts.length : 0}, uniqueProducts=${products.length}, duplicatesSkipped=${duplicateProductsSkipped}, products=${exportedProducts}, variants=${exportedVariants}, setItems=${exportedSetItems}`,
    );

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

      const sheet =
        getWorksheetLoose(workbook, SHEET_PRODUCTS) || workbook.worksheets[0];

      if (!sheet) {
        return ctx.badRequest("Products sheet not found");
      }

      const headerMap = buildHeaderMap(sheet);

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
          const data = applyExcelPublicationState(obj, built.data);

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
                status: data.isActive === false ? "draft" : "published",
              } as any);
            } catch (createError: any) {
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
                status: data.isActive === false ? "draft" : "published",
              } as any);
            }

            const createdDocumentId = String(
              createdEntity?.documentId ?? "",
            ).trim();
            const createdId = Number(createdEntity?.id);

            if (createdDocumentId) processedDocumentIds.add(createdDocumentId);
            if (Number.isFinite(createdId)) processedIds.add(createdId);

            if (data.isActive === false && createdDocumentId) {
              await unpublishProductIfPossible({
                documentId: createdDocumentId,
              });
            }

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
              status: data.isActive === false ? "draft" : "published",
            } as any);

            if (data.isActive === false) {
              await unpublishProductIfPossible({
                documentId: existing.documentId,
              });
            }

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

      const variantsResult = await importVariantsFromWorkbook(workbook);
      const setItemsResult = await importSetItemsFromWorkbook(workbook);

      if (variantsResult.errors.length) {
        for (const err of variantsResult.errors.slice(0, 20)) {
          strapi.log.warn(`[EXCEL] ${err}`);
        }
      }

      if (setItemsResult.errors.length) {
        for (const err of setItemsResult.errors.slice(0, 20)) {
          strapi.log.warn(`[EXCEL] ${err}`);
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
        variants: variantsResult,
        setItems: setItemsResult,
        errors: [
          ...errors,
          ...variantsResult.errors,
          ...setItemsResult.errors,
        ].slice(0, 50),
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

  async clearCatalog(ctx: any) {
  try {
    const confirm = String(ctx.request?.body?.confirm ?? "").trim();

    if (confirm !== "DELETE_ALL_PRODUCTS") {
      ctx.status = 400;
      ctx.body = {
        ok: false,
        message: "Для очистки каталога нужно подтверждение DELETE_ALL_PRODUCTS",
      };
      return;
    }

    const beforeCount = await strapi.db.query(UID).count();

    strapi.log.warn(`[EXCEL] clearCatalog started. Products before=${beforeCount}`);

    await strapi.db.query(UID).deleteMany({
      where: {},
    });

    const afterCount = await strapi.db.query(UID).count();
    const deleted = Math.max(0, beforeCount - afterCount);

    strapi.log.warn(
      `[EXCEL] clearCatalog finished. Deleted=${deleted}, after=${afterCount}`,
    );

    ctx.body = {
      ok: true,
      deleted,
      beforeCount,
      afterCount,
      message: `Каталог очищен. Удалено товаров: ${deleted}`,
    };
  } catch (error: any) {
    strapi.log.error("[EXCEL] clearCatalog failed", error);

    ctx.status = 500;
    ctx.body = {
      ok: false,
      message: "Ошибка очистки каталога",
      error: error?.message ?? String(error),
    };
  }
},

};