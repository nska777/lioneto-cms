import React, { useRef, useState } from "react";
import { Box, Button, Flex, Typography } from "@strapi/design-system";
import { useFetchClient, useNotification } from "@strapi/admin/strapi-admin";

const PriceCsvPage = () => {
  const { getRaw, post } = useFetchClient();
  const notification = useNotification();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<null | "export" | "import">(null);

  const exportCSV = async () => {
    if (busy) return;
    setBusy("export");

    try {
      // ✅ endpoint под product
      const res: any = await getRaw("/product-export");

      // getRaw может вернуть Response-like или объект; вытаскиваем blob безопасно
      const blob =
        typeof res?.blob === "function"
          ? await res.blob()
          : res?.data instanceof Blob
            ? res.data
            : new Blob([res?.data ?? ""], { type: "text/csv;charset=utf-8" });

      // скачивание
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      notification.toggle({ type: "success", message: "Файл скачан" });
    } catch (e: any) {
      notification.toggle({ type: "warning", message: "Ошибка экспорта CSV" });
    } finally {
      setBusy(null);
    }
  };

  const importCSV = async (file?: File) => {
    if (!file) return;
    if (busy) return;

    setBusy("import");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res: any = await post("/product-import", formData);

      // поддерживаем разные shapes ответа
      const payload = res?.data ?? res ?? {};
      const updated = payload?.updated ?? 0;
      const created = payload?.created ?? 0;
      const skipped = payload?.skipped ?? 0;
      const invalid = payload?.invalid ?? 0;
      const dedupRemoved = payload?.dedupRemoved ?? 0;
      const repaired = payload?.repaired ?? 0;

      notification.toggle({
        type: "success",
        message: `Загружено. Обновлено: ${updated}, создано: ${created}, пропущено: ${skipped}${
          invalid ? `, ошибок: ${invalid}` : ""
        }${dedupRemoved ? `, удалено дублей: ${dedupRemoved}` : ""}${
          repaired ? `, repair: ${repaired}` : ""
        }`,
      });
    } catch (e: any) {
      notification.toggle({ type: "warning", message: "Ошибка импорта CSV" });
    } finally {
      // ✅ чтобы можно было загрузить тот же файл повторно
      if (fileRef.current) fileRef.current.value = "";
      setBusy(null);
    }
  };

  return (
    <Box padding={8}>
      <Typography variant="alpha">Импорт / Экспорт товаров (CSV)</Typography>

      <Flex gap={4} marginTop={6}>
        <Button onClick={exportCSV} disabled={!!busy}>
          {busy === "export" ? "Скачивание…" : "📤 Выгрузить товары (CSV)"}
        </Button>

        <label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => importCSV(e.target.files?.[0])}
          />
          <Button as="span" variant="secondary" disabled={!!busy}>
            {busy === "import" ? "Загрузка…" : "📥 Загрузить товары (CSV)"}
          </Button>
        </label>
      </Flex>

      <Box marginTop={4}>
        <Typography variant="pi" textColor="neutral600">
          Подсказка: brand/cat/collectionBadge должны строго совпадать со
          значениями из Strapi (enum). После импорта запускается repair, чтобы
          Content Manager не показывал 0.
        </Typography>
      </Box>
    </Box>
  );
};

export default PriceCsvPage;
