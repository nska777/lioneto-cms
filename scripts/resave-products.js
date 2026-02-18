"use strict";

const path = require("path");
const { createStrapi } = require("@strapi/strapi");

const UID = "api::product.product";
const PAGE_SIZE = 100;

async function main() {
  const appDir = process.cwd();

  const strapi = await createStrapi({
    appDir,
    distDir: path.join(appDir, "dist"),
  }).load();

  const q = strapi.db.query(UID);

  const total = await q.count({ where: { locale: "en" } });
  console.log(`[v2] DB count locale=en: ${total}`);

  let offset = 0;
  let done = 0;

  while (true) {
    const rows = await q.findMany({
      select: ["id", "documentId", "slug", "locale"],
      where: { locale: "en" },
      limit: PAGE_SIZE,
      offset,
      orderBy: { id: "asc" },
    });

    if (!rows.length) break;

    for (const r of rows) {
      const docId = r.documentId;
      const slug = r.slug;

      if (docId && strapi.documents) {
        await strapi.documents(UID).update({
          documentId: docId,
          locale: "en",
          data: { slug },
        });
      } else {
        await strapi.entityService.update(UID, r.id, { data: { slug } });
      }

      done += 1;
      if (done % 50 === 0) console.log(`[v2] updated ${done}/${total}`);
    }

    offset += rows.length;
  }

  console.log(`[v2] done=${done}`);
  await strapi.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
