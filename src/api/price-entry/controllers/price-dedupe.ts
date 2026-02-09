const UID = "api::price-entry.price-entry";

export default {
  async run(ctx: any) {
    const rows = await strapi.db.query(UID).findMany({
      select: ["id", "productId", "updatedAt", "publishedAt"],
      orderBy: { updatedAt: "desc" },
      limit: 100000,
    });

    const keepByProduct = new Map<string, number>(); // productId -> id (самый свежий)
    const toDelete: number[] = [];

    for (const r of rows as any[]) {
      const pid = String(r.productId || "").trim();
      if (!pid) {
        toDelete.push(r.id);
        continue;
      }

      if (!keepByProduct.has(pid)) {
        keepByProduct.set(pid, r.id);
      } else {
        toDelete.push(r.id);
      }
    }

    let deleted = 0;
    if (toDelete.length) {
      await strapi.db.query(UID).deleteMany({
        where: { id: { $in: toDelete } },
      });
      deleted = toDelete.length;
    }

    ctx.send({
      ok: true,
      total: rows.length,
      kept: keepByProduct.size,
      deleted,
    });
  },
};
