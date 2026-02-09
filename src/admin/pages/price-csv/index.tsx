import React from "react";
import { Box, Button, Flex, Typography } from "@strapi/design-system";
import { useNotification } from "@strapi/admin/strapi-admin";

const PriceCsvPage = () => {
  const notification = useNotification();

  // 📤 ЭКСПОРТ — ПРОСТО ОТКРЫВАЕМ URL
  const exportCSV = () => {
    window.open("/api/price-export", "_blank");
  };

  // 📥 ИМПОРТ — через POST
  const importCSV = async (file?: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/price-import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const text = await res.text();
      if (!res.ok) {
        notification.toggle({
          type: "warning",
          message: `Ошибка импорта (${res.status})`,
        });
        console.error("Import error:", res.status, text);
        return;
      }

      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        // если вдруг вернётся не json
      }

      notification.toggle({
        type: "success",
        message: `Готово: обновлено ${json.updated ?? 0}, создано ${json.created ?? 0}`,
      });
    } catch (e) {
      notification.toggle({
        type: "warning",
        message: "Ошибка импорта CSV",
      });
      console.error(e);
    }
  };

  return (
    <Box padding={8}>
      <Typography variant="alpha">Импорт / Экспорт цен</Typography>

      <Flex gap={4} marginTop={6}>
        {/* ⬇⬇ ВОТ СЮДА ⬇⬇ */}
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
        {/* ⬆⬆ ДО СЮДА ⬆⬆ */}
      </Flex>
    </Box>
  );
};

export default PriceCsvPage;
