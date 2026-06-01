export default {
  routes: [
    {
      method: "GET",
      path: "/price-export",
      handler: "price-csv.export",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/price-import",
      handler: "price-csv.import",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/price-clear-catalog",
      handler: "price-csv.clearCatalog",
      config: { auth: false },
    },
  ],
};