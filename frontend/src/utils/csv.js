/**
 * Geração e download de CSV no navegador, com os ajustes que o Excel em
 * português espera: separador ";" e BOM UTF-8 (sem ele os acentos quebram).
 */

const SEPARADOR = ";";
const BOM = "﻿";

// Excel interpreta como fórmula qualquer célula iniciada por estes caracteres.
// Como os dados vêm de formulário público, o valor é prefixado com apóstrofo
// para o Excel tratar sempre como texto (CSV injection).
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

function escaparCampo(valor) {
  if (valor === null || valor === undefined) return '""';

  const texto = String(valor).replace(/\r?\n/g, " ").trim();
  const seguro = INICIO_DE_FORMULA.test(texto) ? `'${texto}` : texto;

  return `"${seguro.replace(/"/g, '""')}"`;
}

/**
 * Monta o conteúdo do CSV.
 *
 * @param {Array<{ label: string, valor: (linha: any) => unknown }>} colunas
 * @param {Array<any>} linhas
 */
export function gerarCsv(colunas, linhas) {
  const cabecalho = colunas.map((coluna) => escaparCampo(coluna.label)).join(SEPARADOR);
  const corpo = linhas.map((linha) =>
    colunas.map((coluna) => escaparCampo(coluna.valor(linha))).join(SEPARADOR)
  );

  return [cabecalho, ...corpo].join("\r\n");
}

export function baixarCsv(nomeArquivo, conteudo) {
  const blob = new Blob([BOM + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function exportarCsv(nomeArquivo, colunas, linhas) {
  baixarCsv(nomeArquivo, gerarCsv(colunas, linhas));
}

/** Sufixo de data para o nome do arquivo: "2026-08-18". */
export function carimboDeData(data = new Date()) {
  const dois = (n) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}
