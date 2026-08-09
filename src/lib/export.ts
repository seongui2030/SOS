export type ExportRow = {
  conversation: string;
  role: string;
  content: string;
  created_at: string;
  emergency_keywords?: string[] | null;
};

function roleLabel(role: string) {
  return role === "user" ? "내 질문" : "AI 답변";
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportRowsToCsv(rows: ExportRow[], filename: string) {
  const header = ["대화", "구분", "내용", "시간", "응급 키워드"];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        csvCell(row.conversation),
        csvCell(roleLabel(row.role)),
        csvCell(row.content),
        csvCell(formatTime(row.created_at)),
        csvCell((row.emergency_keywords ?? []).join(" ")),
      ].join(","),
    ),
  ];
  // BOM keeps Korean readable in Excel.
  downloadBlob(new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), filename);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportRowsToPdf(rows: ExportRow[], title: string) {
  const body = rows
    .map(
      (row) => `
        <article class="turn ${row.role === "user" ? "user" : "ai"}">
          <p class="meta">${escapeHtml(row.conversation)} · ${escapeHtml(roleLabel(row.role))} · ${escapeHtml(
            formatTime(row.created_at),
          )}</p>
          <p class="content">${escapeHtml(row.content).replace(/\n/g, "<br />")}</p>
          ${
            (row.emergency_keywords ?? []).length > 0
              ? `<p class="alert">응급 키워드: ${escapeHtml((row.emergency_keywords ?? []).join(", "))}</p>`
              : ""
          }
        </article>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 16mm; }
  body { font-family: "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif; color: #1f2937; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6b7280; margin: 0 0 20px; }
  .turn { border-left: 3px solid #cbd5e1; padding: 6px 0 6px 12px; margin-bottom: 14px; page-break-inside: avoid; }
  .turn.user { border-color: #0f766e; }
  .meta { font-size: 11px; color: #6b7280; margin: 0 0 4px; }
  .content { font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap; }
  .alert { font-size: 11px; color: #b91c1c; margin: 6px 0 0; }
  footer { margin-top: 24px; font-size: 11px; color: #6b7280; }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">내보낸 시각: ${escapeHtml(new Date().toLocaleString("ko-KR"))} · 총 ${rows.length}건</p>
  ${body || '<p class="content">저장된 대화가 없습니다.</p>'}
  <footer>이 기록은 참고용입니다. 진단과 처방은 반드시 의사·약사와 상담하세요.</footer>
</body></html>`;

  // Print via a hidden iframe: popups are blocked inside the preview frame.
  try {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.srcdoc = html;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${title}.html`);
      }
      setTimeout(() => frame.remove(), 60000);
    };
    document.body.appendChild(frame);
    return true;
  } catch {
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${title}.html`);
    return true;
  }
}

export type HealthRow = {
  created_at: string;
  height_cm: number;
  weight_kg: number;
  gender: string;
  age: number;
  bmi: number;
  bmr: number;
};

export function exportHealthsToCsv(rows: HealthRow[], filename: string) {
  const header = ["측정일", "키(cm)", "몸무게(kg)", "성별", "나이", "BMI", "BMR(kcal)"];
  const genderLabel = (value: string) => (value === "female" ? "여성" : value === "male" ? "남성" : value);
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        csvCell(new Date(row.created_at).toLocaleString("ko-KR")),
        csvCell(String(row.height_cm)),
        csvCell(String(row.weight_kg)),
        csvCell(genderLabel(row.gender)),
        csvCell(String(row.age)),
        csvCell(String(row.bmi)),
        csvCell(String(row.bmr)),
      ].join(","),
    ),
  ];
  downloadBlob(new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), filename);
}

