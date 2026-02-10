import React from "react";

const MoneyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 7h16v10H4V7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8 12h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M6.5 9.5h0.01M17.5 14.5h0.01"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export default {
  register(app: any) {
    app.addMenuLink({
      to: "/plugins/price-csv",
      icon: MoneyIcon, // ВАЖНО: компонент, не строка
      intlLabel: {
        id: "price-csv.menu",
        defaultMessage: "Prices CSV",
      },
      Component: async () => {
        const module = await import("./pages/price-csv");
        return module.default; // ВАЖНО: возвращаем default компонент
      },
      permissions: [],
    });
  },
};
