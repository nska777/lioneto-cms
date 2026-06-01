import React, { useMemo, useRef, useState } from "react";
import { Box, Button, Flex, Typography } from "@strapi/design-system";
import { useNotification } from "@strapi/admin/strapi-admin";

type ImportMode = "sync" | "replace";
type BusyState = null | ImportMode | "clear";

type ImportResult = {
  ok?: boolean;
  mode?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  invalid?: number;
  deactivated?: number;
  deleted?: number;
  errors?: string[];
  message?: string;
};

const PriceCsvPage = () => {
  const notification = useNotification();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState<BusyState>(null);
  const [pendingMode, setPendingMode] = useState<ImportMode>("sync");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rawError, setRawError] = useState("");

  const isBusy = !!busy;

  const modeLabel = useMemo(() => {
    if (busy === "replace") return "Замена каталога";
    if (busy === "sync") return "Обновление каталога";
    if (busy === "clear") return "Очистка каталога";
    return "";
  }, [busy]);

  const exportCatalog = () => {
    window.open("/api/price-export", "_blank");
  };

  const pickFile = (mode: ImportMode) => {
    if (busy) return;

    setPendingMode(mode);
    setUploadProgress(0);
    setStatusText("");
    setSelectedFileName("");
    setResult(null);
    setRawError("");

    fileRef.current?.click();
  };

  const clearCatalog = async () => {
    if (busy) return;

    const firstConfirm = window.confirm(
      "ВНИМАНИЕ! Это физически удалит ВСЕ товары из Strapi. Медиафайлы и картинки НЕ удаляются. Перед очисткой обязательно выгрузите backup Excel. Продолжить?",
    );

    if (!firstConfirm) return;

    const text = window.prompt(
      "Для подтверждения напишите точно: DELETE_ALL_PRODUCTS",
    );

    if (text !== "DELETE_ALL_PRODUCTS") {
      window.alert("Очистка отменена. Подтверждение введено неверно.");
      return;
    }

    try {
      setBusy("clear");
      setUploadProgress(20);
      setSelectedFileName("");
      setResult(null);
      setRawError("");
      setStatusText("Очистка каталога началась…");

      const res = await fetch("/api/price-clear-catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          confirm: "DELETE_ALL_PRODUCTS",
        }),
      });

      let payload: ImportResult = {};

      try {
        payload = await res.json();
      } catch {
        payload = {};
      }

      console.log("Catalog clear response:", payload);

      if (!res.ok || !payload.ok) {
        const msg =
          payload?.message ||
          payload?.errors?.[0] ||
          `Ошибка очистки каталога (${res.status})`;

        setRawError(msg);
        setStatusText("Ошибка очистки каталога");

        notification.toggle({
          type: "warning",
          message: msg,
        });

        return;
      }

      setUploadProgress(100);
      setResult(payload);
      setStatusText(`Каталог очищен. Удалено товаров: ${payload.deleted ?? 0}`);

      notification.toggle({
        type: "success",
        message: `Каталог очищен. Удалено товаров: ${payload.deleted ?? 0}`,
      });

      window.alert(`Каталог очищен. Удалено товаров: ${payload.deleted ?? 0}`);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Ошибка очистки каталога";

      setRawError(msg);
      setStatusText("Ошибка очистки каталога");

      notification.toggle({
        type: "warning",
        message: msg,
      });
    } finally {
      setBusy(null);
    }
  };

  const importCatalog = async (file?: File) => {
    if (!file) return;
    if (busy) return;

    const name = file.name.toLowerCase();

    if (!name.endsWith(".xlsx")) {
      notification.toggle({
        type: "warning",
        message: "Загрузите Excel-файл в формате .xlsx",
      });

      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const mode = pendingMode;

    setBusy(mode);
    setSelectedFileName(file.name);
    setUploadProgress(0);
    setResult(null);
    setRawError("");
    setStatusText("Подготовка файла к загрузке…");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", `/api/price-import?mode=${mode}`, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        setStatusText("Файл загружается…");
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(percent);

      if (percent < 100) {
        setStatusText(`Файл загружается… ${percent}%`);
      } else {
        setStatusText(
          "Файл загружен. CMS обрабатывает товары, это может занять несколько минут…",
        );
      }
    };

    xhr.onload = () => {
      let payload: ImportResult = {};

      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        payload = {};
      }

      console.log("Catalog import response:", payload);
      setResult(payload);

      if (xhr.status < 200 || xhr.status >= 300) {
        setRawError(xhr.responseText || `HTTP ${xhr.status}`);
        setStatusText("Ошибка загрузки каталога");

        notification.toggle({
          type: "warning",
          message: `Ошибка загрузки каталога (${xhr.status})`,
        });

        return;
      }

      const msg =
        mode === "replace"
          ? `Каталог заменен. Создано: ${payload.created ?? 0}, обновлено: ${
              payload.updated ?? 0
            }, скрыто старых: ${payload.deactivated ?? 0}, пропущено: ${
              payload.skipped ?? 0
            }, ошибок: ${payload.invalid ?? 0}`
          : `Каталог обновлен. Создано: ${payload.created ?? 0}, обновлено: ${
              payload.updated ?? 0
            }, пропущено: ${payload.skipped ?? 0}, ошибок: ${
              payload.invalid ?? 0
            }`;

      setStatusText("Готово");
      notification.toggle({
        type: "success",
        message: msg,
      });
    };

    xhr.onerror = () => {
      setRawError("Network error");
      setStatusText("Ошибка сети при загрузке файла");

      notification.toggle({
        type: "warning",
        message: "Ошибка сети при загрузке каталога",
      });
    };

    xhr.onloadend = () => {
      if (fileRef.current) fileRef.current.value = "";
      setBusy(null);
    };

    xhr.send(formData);
  };

  return (
    <Box padding={8}>
      <Typography variant="alpha">Импорт / Экспорт каталога</Typography>

      <Box marginTop={2}>
        <Typography variant="epsilon" textColor="neutral600">
          Excel-файл используется для создания и обновления товаров, цен,
          описаний и характеристик. Картинки, галерея, PDF-инструкции, variants
          и set_items_json при импорте не затираются.
        </Typography>
      </Box>

      <Flex gap={4} marginTop={6} wrap="wrap">
        <Button onClick={exportCatalog} disabled={isBusy}>
          📤 Выгрузить каталог (Excel)
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={(e) => importCatalog(e.target.files?.[0])}
        />

        <Button
          variant="secondary"
          disabled={isBusy}
          onClick={() => pickFile("sync")}
        >
          {busy === "sync" ? "Загрузка…" : "📥 Обновить каталог"}
        </Button>

        <Button
          variant="danger-light"
          disabled={isBusy}
          onClick={() => pickFile("replace")}
        >
          {busy === "replace"
            ? "Замена каталога…"
            : "⚠️ Заменить каталог полностью"}
        </Button>

        <Button variant="danger-light" disabled={isBusy} onClick={clearCatalog}>
          {busy === "clear" ? "Очистка…" : "🗑 Очистить каталог"}
        </Button>
      </Flex>

      <Box marginTop={5}>
        <Typography variant="pi" textColor="neutral600">
          «Обновить каталог» — обновляет товары из Excel и добавляет новые.
          «Заменить каталог полностью» — скрывает товары, которых нет в Excel.
          «Очистить каталог» — физически удаляет все товары из Strapi, но не
          удаляет картинки из Media Library.
        </Typography>
      </Box>

      {(isBusy || result || rawError) && (
        <Box
          marginTop={6}
          padding={5}
          style={{
            maxWidth: 760,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <Typography variant="delta">
            {isBusy ? modeLabel : "Результат операции"}
          </Typography>

          {selectedFileName ? (
            <Box marginTop={3}>
              <Typography variant="pi" textColor="neutral600">
                Файл: {selectedFileName}
              </Typography>
            </Box>
          ) : null}

          <Box marginTop={4}>
            <div
              style={{
                height: 10,
                width: "100%",
                overflow: "hidden",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  borderRadius: 999,
                  background: busy === "clear" ? "#D02B20" : "#7B61FF",
                  transition: "width 0.2s ease",
                }}
              />
            </div>

            <Box marginTop={2}>
              <Typography variant="pi" textColor="neutral600">
                {statusText || "Ожидание…"}
              </Typography>
            </Box>
          </Box>

          {result ? (
            <Box marginTop={5}>
              <Flex gap={3} wrap="wrap">
                {typeof result.deleted === "number" ? (
                  <Box
                    padding={3}
                    style={{ border: "1px solid #333", borderRadius: 10 }}
                  >
                    <Typography variant="pi">Удалено товаров</Typography>
                    <Typography variant="beta">{result.deleted}</Typography>
                  </Box>
                ) : null}

                <Box
                  padding={3}
                  style={{ border: "1px solid #333", borderRadius: 10 }}
                >
                  <Typography variant="pi">Создано</Typography>
                  <Typography variant="beta">{result.created ?? 0}</Typography>
                </Box>

                <Box
                  padding={3}
                  style={{ border: "1px solid #333", borderRadius: 10 }}
                >
                  <Typography variant="pi">Обновлено</Typography>
                  <Typography variant="beta">{result.updated ?? 0}</Typography>
                </Box>

                <Box
                  padding={3}
                  style={{ border: "1px solid #333", borderRadius: 10 }}
                >
                  <Typography variant="pi">Пропущено</Typography>
                  <Typography variant="beta">{result.skipped ?? 0}</Typography>
                </Box>

                <Box
                  padding={3}
                  style={{ border: "1px solid #333", borderRadius: 10 }}
                >
                  <Typography variant="pi">Ошибок</Typography>
                  <Typography variant="beta">{result.invalid ?? 0}</Typography>
                </Box>

                <Box
                  padding={3}
                  style={{ border: "1px solid #333", borderRadius: 10 }}
                >
                  <Typography variant="pi">Скрыто старых</Typography>
                  <Typography variant="beta">
                    {result.deactivated ?? 0}
                  </Typography>
                </Box>
              </Flex>

              {result.message ? (
                <Box marginTop={4}>
                  <Typography variant="pi" textColor="neutral600">
                    {result.message}
                  </Typography>
                </Box>
              ) : null}

              {Array.isArray(result.errors) && result.errors.length > 0 ? (
                <Box marginTop={5}>
                  <Typography variant="delta">Ошибки по строкам</Typography>

                  <Box
                    marginTop={3}
                    padding={3}
                    style={{
                      maxHeight: 240,
                      overflow: "auto",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    {result.errors.map((err, index) => (
                      <Typography
                        key={`${err}-${index}`}
                        variant="pi"
                        textColor="danger600"
                      >
                        {err}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ) : null}
            </Box>
          ) : null}

          {rawError ? (
            <Box marginTop={5}>
              <Typography variant="delta" textColor="danger600">
                Ошибка
              </Typography>

              <Box
                marginTop={3}
                padding={3}
                style={{
                  maxHeight: 240,
                  overflow: "auto",
                  border: "1px solid rgba(255,0,0,0.25)",
                  borderRadius: 10,
                  background: "rgba(255,0,0,0.06)",
                  whiteSpace: "pre-wrap",
                }}
              >
                <Typography variant="pi" textColor="danger600">
                  {rawError}
                </Typography>
              </Box>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default PriceCsvPage;
