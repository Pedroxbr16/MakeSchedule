"use client";

import { useMemo, useState } from "react";

type ScaleRow = {
  id: number;
  pessoa: string;
  funcao: string;
};

const createRow = (id: number): ScaleRow => ({
  id,
  pessoa: "",
  funcao: ""
});

const formatDate = (value: string) => {
  if (!value) return "Sem data";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const wrapTextLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const normalized = text.trim();
  if (!normalized) return [""];

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0] ?? "";

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];
    const testLine = `${currentLine} ${word}`;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
};

export default function Home() {
  const [titulo, setTitulo] = useState("Escala Semanal");
  const [data, setData] = useState("");
  const [obs, setObs] = useState("");
  const [rows, setRows] = useState<ScaleRow[]>([createRow(1)]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const canRemoveRows = rows.length > 1;

  const totalPessoas = useMemo(
    () => rows.filter((row) => row.pessoa.trim().length > 0).length,
    [rows]
  );

  const updateRow = (id: number, field: "pessoa" | "funcao", value: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const addRow = () => {
    setRows((current) => [...current, createRow(Date.now())]);
  };

  const removeRow = (id: number) => {
    if (!canRemoveRows) return;
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const handleExportPng = async () => {
    setIsExporting(true);
    setExportError("");

    try {
      const renderWidth = 1200;
      const scale = 2;
      const panelPadding = 48;
      const columnGap = 24;
      const lineHeight = 34;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Nao foi possivel inicializar o canvas.");

      ctx.font = "36px Georgia, serif";
      const titleText = titulo.trim() || "Sem titulo";
      const dateText = `Data: ${formatDate(data)}`;
      const noteText = obs.trim() || "Sem observacoes gerais.";
      const noteParagraphs = noteText.split(/\r?\n/);

      ctx.font = "30px Georgia, serif";
      const noteLines: string[] = [];
      for (const paragraph of noteParagraphs) {
        const wrapped = wrapTextLines(ctx, paragraph, renderWidth - panelPadding * 2 - 28);
        noteLines.push(...wrapped);
      }

      const notesBoxPadding = 20;
      const notesHeight = noteLines.length * lineHeight + notesBoxPadding * 2;
      const tableHeaderHeight = 64;
      const rowHeight = 58;
      const totalRows = Math.max(rows.length, 1);
      const tableHeight = tableHeaderHeight + totalRows * rowHeight;
      const contentHeight =
        panelPadding +
        56 +
        44 +
        notesHeight +
        30 +
        tableHeight +
        panelPadding;

      const safeTitle = (titulo.trim() || "escala")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const fileTitle = safeTitle || "escala";
      const datePart = data || "sem-data";
      const fileName = `${fileTitle}-${datePart}.png`;

      canvas.width = renderWidth * scale;
      canvas.height = contentHeight * scale;
      ctx.scale(scale, scale);

      ctx.fillStyle = "#fdfbf7";
      ctx.fillRect(0, 0, renderWidth, contentHeight);

      let y = panelPadding;

      ctx.fillStyle = "#1e211f";
      ctx.font = "700 52px 'Trebuchet MS', sans-serif";
      ctx.fillText(titleText, panelPadding, y);
      y += 56;

      ctx.fillStyle = "#5f6660";
      ctx.font = "400 30px Georgia, serif";
      ctx.fillText(dateText, panelPadding, y);
      y += 24;

      const notesX = panelPadding;
      const notesY = y + 20;
      const notesWidth = renderWidth - panelPadding * 2;
      ctx.fillStyle = "#f8f1e8";
      ctx.fillRect(notesX, notesY, notesWidth, notesHeight);
      ctx.fillStyle = "#c25b3f";
      ctx.fillRect(notesX, notesY, 6, notesHeight);

      ctx.fillStyle = "#5f6660";
      ctx.font = "400 30px Georgia, serif";
      let lineY = notesY + notesBoxPadding + 26;
      for (const line of noteLines) {
        ctx.fillText(line, notesX + 20, lineY);
        lineY += lineHeight;
      }

      y = notesY + notesHeight + 30;
      const tableX = panelPadding;
      const tableWidth = renderWidth - panelPadding * 2;
      const personColumnWidth = (tableWidth - columnGap) / 2;
      const roleColumnX = tableX + personColumnWidth + columnGap;

      ctx.fillStyle = "#d9ddde";
      ctx.fillRect(tableX, y, tableWidth, tableHeaderHeight);
      ctx.fillStyle = "#1e211f";
      ctx.font = "700 34px 'Trebuchet MS', sans-serif";
      ctx.fillText("Pessoa", tableX + 20, y + 42);
      ctx.fillText("Funcao", roleColumnX + 20, y + 42);
      y += tableHeaderHeight;

      ctx.font = "400 30px Georgia, serif";
      const rowsToRender =
        rows.length > 0
          ? rows
          : [
              {
                id: 0,
                pessoa: "-",
                funcao: "-"
              }
            ];

      for (const row of rowsToRender) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(tableX, y, tableWidth, rowHeight);
        ctx.strokeStyle = "#d8d4cc";
        ctx.lineWidth = 1;
        ctx.strokeRect(tableX, y, tableWidth, rowHeight);

        ctx.fillStyle = "#1e211f";
        ctx.fillText(row.pessoa.trim() || "-", tableX + 20, y + 38);
        ctx.fillText(row.funcao.trim() || "-", roleColumnX + 20, y + 38);
        y += rowHeight;
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha inesperada na exportacao.";
      setExportError(`Nao foi possivel exportar agora: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="page">
      <section className="panel input-panel">
        <p className="eyebrow">Gerador de Escala</p>
        <h1>Monta Escala</h1>
        <p className="intro">
          Preencha os dados e veja a tabela de escala sendo atualizada na hora.
        </p>

        <div className="field">
          <label htmlFor="titulo">Titulo</label>
          <input
            id="titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Escala de Plantao"
          />
        </div>

        <div className="field">
          <label htmlFor="data">Data</label>
          <input
            id="data"
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="obs">Observacoes</label>
          <textarea
            id="obs"
            rows={4}
            value={obs}
            onChange={(event) => setObs(event.target.value)}
            placeholder="Informacoes gerais para esta escala"
          />
        </div>

        <div className="people-head">
          <h2>Pessoas e Funcoes</h2>
          <button type="button" onClick={addRow}>
            Adicionar linha
          </button>
        </div>

        <div className="rows">
          {rows.map((row, index) => (
            <div className="row-editor" key={row.id}>
              <div className="field">
                <label htmlFor={`pessoa-${row.id}`}>Pessoa {index + 1}</label>
                <input
                  id={`pessoa-${row.id}`}
                  value={row.pessoa}
                  onChange={(event) => updateRow(row.id, "pessoa", event.target.value)}
                  placeholder="Nome da pessoa"
                />
              </div>
              <div className="field">
                <label htmlFor={`funcao-${row.id}`}>Funcao</label>
                <input
                  id={`funcao-${row.id}`}
                  value={row.funcao}
                  onChange={(event) => updateRow(row.id, "funcao", event.target.value)}
                  placeholder="Ex: Lider, Apoio, Som"
                />
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => removeRow(row.id)}
                disabled={!canRemoveRows}
              >
                Remover
              </button>
               <button type="button" onClick={addRow}>
            Adicionar linha Abaixo
          </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel preview-panel">
        <div className="preview-header">
          <p className="eyebrow">Preview</p>
          <div className="preview-actions">
            <p className="meta">{totalPessoas} pessoa(s) preenchida(s)</p>
            <button type="button" onClick={handleExportPng} disabled={isExporting}>
              {isExporting ? "Exportando..." : "Exportar PNG"}
            </button>
          </div>
        </div>

        <div>
          <h2>{titulo.trim() || "Sem titulo"}</h2>
          <p className="meta">Data: {formatDate(data)}</p>
          <p className="notes">{obs.trim() || "Sem observacoes gerais."}</p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pessoa(s)</th>
                  <th>Funcao</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`preview-${row.id}`}>
                    <td>{row.pessoa.trim() || "-"}</td>
                    <td>{row.funcao.trim() || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {exportError ? <p className="export-error">{exportError}</p> : null}
      </section>
    </main>
  );
}
