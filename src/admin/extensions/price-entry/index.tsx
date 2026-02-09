import React from "react";
import { Button, Flex } from "@strapi/design-system";
import { useFetchClient, useNotification } from "@strapi/admin/strapi-admin";

const PriceCsvActions = () => {
  const { getRaw, post } = useFetchClient();
  const notification = useNotification();

  // 📤 EXPORT CSV
  const exportCSV = async () => {
    try {
      const res = await getRaw("/price-export");
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "price-entry.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      notification.toggle({
        type: "warning",
        message: "Ошибка экспорта CSV",
      });
    }
  };

  // 📥 IMPORT CSV
  const importCSV = async (file?: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await post("/price-import", formData);
      notification.toggle({
        type: "success",
        message: "Цены успешно обновлены",
      });
      window.location.reload();
    } catch {
      notification.toggle({
        type: "warning",
        message: "Ошибка импорта CSV",
      });
    }
  };

  return (
    <Flex gap={2}>
      <Button onClick={exportCSV}>📤 Выгрузить цены (CSV)</Button>

      <label>
        <input
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => importCSV(e.target.files?.[0])}
        />
        <Button as="span" variant="secondary">
          📥 Загрузить цены (CSV)
        </Button>
      </label>
    </Flex>
  );
};

export default {
  register(app: any) {
    app.injectContentManagerComponent("listView", "actions", {
      name: "price-csv-actions",
      Component: PriceCsvActions,
    });
  },
};
