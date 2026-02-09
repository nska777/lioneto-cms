export default {
  routes: [
    {
      method: "POST",
      path: "/price-dedupe",
      handler: "price-dedupe.run",
      config: { auth: false },
    },
  ],
};
