import React from "react";
import { Box, Button, Flex, Typography } from "@strapi/design-system";
import { useFetchClient, useNotification } from "@strapi/admin/strapi-admin";

const PriceCsvPage = () => {
  const { getRaw, post } = useFetchClient();
  const notification = useNotification();

  const exportCSV = async () => {
    try {
      // ✅ новый endpoint под product
      const res = await getRaw("/product-export");
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      notification.toggle({ type: "warning", message: "Ошибка экспорта CSV" });
    }
  };

  const importCSV = async (file?: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // ✅ новый endpoint под product
      const res = await post("/product-import", formData);

      // если контроллер возвращает updated/created — покажем красиво
      const updated = (res as any)?.data?.updated ?? (res as any)?.updated;
      const created = (res as any)?.data?.created ?? (res as any)?.created;

      notification.toggle({
        type: "success",
        message:
          updated || created
            ? `Готово. Обновлено: ${updated ?? 0}, создано: ${created ?? 0}`
            : "Данные обновлены",
      });
    } catch {
      notification.toggle({ type: "warning", message: "Ошибка импорта CSV" });
    }
  };

  return (
    <Box padding={8}>
      <Typography variant="alpha">Импорт / Экспорт товаров (CSV)</Typography>

      <Flex gap={4} marginTop={6}>
        <Button onClick={exportCSV}>📤 Выгрузить товары (CSV)</Button>

        <label>
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => importCSV(e.target.files?.[0])}
          />
          <Button as="span" variant="secondary">
            📥 Загрузить товары (CSV)
          </Button>
        </label>
      </Flex>
    </Box>
  );
};

export default PriceCsvPage;
