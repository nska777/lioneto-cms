"use strict";

function normalizeVariants(event) {
  const data = event?.params?.data;
  if (!data) return;

  // Важно: variants может быть undefined, если ты не трогал variants при апдейте
  if (!Array.isArray(data.variants)) return;

  data.variants = data.variants.map((v) => {
    if (!v) return v;

    const type = (v.type ?? "").toString().trim();     // 'color' | 'mechanism' | 'option'
    const group = (v.group ?? "").toString().trim();   // text

    // 1) group = type, если group пустой
    const nextGroup = group || type;

    // 2) variantKey нормализуем (чтобы CSV/price-entry совпадали)
    let key = (v.variantKey ?? "").toString().trim();
    if (key) {
      const low = key.toLowerCase();
      if (low === "white") key = "white";
      if (low === "capuccino" || low === "cappuccino") key = "cappuccino";
    }

    return { ...v, group: nextGroup, variantKey: key };
  });
}

module.exports = {
  beforeCreate: normalizeVariants,
  beforeUpdate: normalizeVariants,
};
