import React from "react";
import { Box, Button, Flex, Typography } from "@strapi/design-system";
import { useFetchClient, useNotification } from "@strapi/admin/strapi-admin";

const PriceCsvPage = () => {
  const { getRaw, post } = useFetchClient();
  const notification = useNotification();

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
      notification.toggle({ type: "warning", message: "Ошибка экспорта CSV" });
    }
  };

  const importCSV = async (file?: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      await post("/price-import", formData);
      notification.toggle({ type: "success", message: "Цены обновлены" });
    } catch {
      notification.toggle({ type: "warning", message: "Ошибка импорта CSV" });
    }
  };

  return (
    <Box padding={8}>
      <Typography variant="alpha">Импорт / Экспорт цен</Typography>

      <Flex gap={4} marginTop={6}>
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
    </Box>
  );
};

export default PriceCsvPage;
