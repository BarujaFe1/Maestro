import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { captureRef } from 'react-native-view-shot';

async function shareIfPossible(uri, mimeType) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return uri;
  await Sharing.shareAsync(uri, mimeType ? { mimeType } : undefined);
  return uri;
}

function humanDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
}

function buildWorksheet(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = rows.length ? Object.keys(rows[0]) : [];
  ws['!cols'] = keys.map((key) => {
    const maxCell = Math.max(String(key).length, ...rows.map((row) => String(row[key] ?? '').length));
    return { wch: Math.min(Math.max(maxCell + 2, 12), 36) };
  });
  if (keys.length) {
    const lastCol = XLSX.utils.encode_col(keys.length - 1);
    ws['!autofilter'] = { ref: `A1:${lastCol}${rows.length + 1}` };
  }
  return ws;
}

export async function exportHtmlPdf({ html, fileName = 'relatorio.pdf' }) {
  const result = await Print.printToFileAsync({ html });
  const targetUri = `${FileSystem.cacheDirectory}${fileName}`;
  try {
    await FileSystem.copyAsync({ from: result.uri, to: targetUri });
    return shareIfPossible(targetUri, 'application/pdf');
  } catch {
    return shareIfPossible(result.uri, 'application/pdf');
  }
}

export async function exportExcel({ rows, sheetName = 'Dados', fileName = 'relatorio.xlsx' }) {
  const wb = XLSX.utils.book_new();
  const ws = buildWorksheet(rows || []);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return shareIfPossible(uri, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function exportJsonBackup(data, fileName = 'maestro-backup.json') {
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  return shareIfPossible(uri, 'application/json');
}

export async function exportChartAsImage(viewRef, fileName = 'grafico.png') {
  const uriCaptured = await captureRef(viewRef, { format: 'png', quality: 1 });
  const targetUri = `${FileSystem.cacheDirectory}${fileName}`;
  try {
    await FileSystem.copyAsync({ from: uriCaptured, to: targetUri });
    return shareIfPossible(targetUri, 'image/png');
  } catch {
    return shareIfPossible(uriCaptured, 'image/png');
  }
}

export function buildIndividualReportHtml({ student, analytics, lessons, filters = {} }) {
  const k = analytics.kpis;
  const flags = analytics.flags;
  return `
  <html><head><style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    h1, h2 { margin: 0 0 12px; }
    .muted { color: #475569; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .card { border: 1px solid #dbe2ea; border-radius: 10px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #dbe2ea; padding: 8px; text-align: left; }
    thead { display: table-header-group; }
    th { background: #eff6ff; }
  </style></head><body>
    <h1>Relatório individual</h1>
    <p class="muted"><strong>Período:</strong> ${humanDate(filters.from)} até ${humanDate(filters.to)}</p>
    <p class="muted"><strong>Aluno:</strong> ${student.full_name}</p>
    <p class="muted"><strong>Instrumento:</strong> ${student.instrument || '-'} • <strong>Graduação:</strong> ${student.level || '-'} • <strong>Congregação:</strong> ${student.congregation || '-'}</p>
    <div class="grid">
      <div class="card"><strong>Total de aulas</strong><br/>${k.totalLessons}</div>
      <div class="card"><strong>Média de desempenho</strong><br/>${k.avgScore}</div>
      <div class="card"><strong>Último desempenho</strong><br/>${k.lastScore}</div>
      <div class="card"><strong>Evolução</strong><br/>${k.progressDelta}</div>
    </div>
    <h2>Alertas</h2>
    <ul>
      <li>Estagnação: ${flags.stagnation ? 'Sim' : 'Não'}</li>
      <li>Progresso acelerado: ${flags.accelerated ? 'Sim' : 'Não'}</li>
      <li>Queda de desempenho: ${flags.decline ? 'Sim' : 'Não'}</li>
    </ul>
    <h2>Histórico de aulas</h2>
    <table><thead><tr><th>Data</th><th>Método</th><th>Páginas</th><th>Lições</th><th>Conteúdo</th><th>Desempenho</th></tr></thead><tbody>
      ${lessons.map((l) => `<tr><td>${humanDate(l.lesson_date)}</td><td>${l.method_name || ''}</td><td>${l.pages || ''}</td><td>${l.lesson_name || ''}</td><td>${l.hymns || ''}</td><td>${l.performance_score ?? l.performance_concept ?? ''}</td></tr>`).join('')}
    </tbody></table>
  </body></html>`;
}

export function buildGroupReportHtml({ filters, group, modules = {} }) {
  const rankingRows = group.ranking.slice(0, 25);
  const alertRows = group.noRegisterAlerts.slice(0, 20);
  const methodRows = (modules.methodsUsage || []).slice(0, 15);
  return `
  <html><head><style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    h1, h2 { margin: 0 0 12px; }
    .muted { color: #475569; }
    .summary { margin-bottom: 18px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
    .card { border: 1px solid #dbe2ea; border-radius: 10px; padding: 12px; }
    .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border: 1px solid #dbe2ea; padding: 8px; text-align: left; }
    thead { display: table-header-group; }
    th { background: #eff6ff; }
  </style></head><body>
    <h1>Relatório coletivo Maestro</h1>
    <div class="summary muted">
      <div><strong>Período:</strong> ${humanDate(filters.from)} até ${humanDate(filters.to)}</div>
      <div><strong>Unidade:</strong> ${filters.unit_label || 'Todas'} • <strong>Instrumento:</strong> ${filters.instrument || 'Todos'} • <strong>Família:</strong> ${filters.category || 'Todas'}</div>
      <div><strong>Professor:</strong> ${filters.teacher_label || 'Todos'} • <strong>Método:</strong> ${filters.method_label || 'Todos'}</div>
    </div>
    <div class="grid">
      <div class="card"><div>Alunos</div><div class="value">${group.kpis.studentsCount}</div></div>
      <div class="card"><div>Ativos</div><div class="value">${group.kpis.activeStudents}</div></div>
      <div class="card"><div>Registros</div><div class="value">${group.kpis.lessonsCount}</div></div>
      <div class="card"><div>Média geral</div><div class="value">${group.kpis.avgGroupScore}</div></div>
    </div>
    <h2>Alertas de ausência de registro</h2>
    <table><thead><tr><th>Aluno</th><th>Instrumento</th><th>Dias sem registro</th></tr></thead><tbody>
      ${alertRows.length ? alertRows.map((row) => `<tr><td>${row.name}</td><td>${row.instrument || '-'}</td><td>${row.daysNoRegister ?? 'Sem aulas'}</td></tr>`).join('') : '<tr><td colspan="3">Nenhum alerta no período.</td></tr>'}
    </tbody></table>
    <h2>Ranking de evolução</h2>
    <table><thead><tr><th>Posição</th><th>Aluno</th><th>Instrumento</th><th>Graduação</th><th>Evolução</th><th>Média</th><th>Registros</th></tr></thead><tbody>
      ${rankingRows.length ? rankingRows.map((r, idx) => `<tr><td>${idx + 1}</td><td>${r.name}</td><td>${r.instrument || '-'}</td><td>${r.level || '-'}</td><td>${r.progressDelta}</td><td>${r.avgScore}</td><td>${r.totalLessons}</td></tr>`).join('') : '<tr><td colspan="7">Sem dados para o filtro.</td></tr>'}
    </tbody></table>
    <h2>Uso de métodos</h2>
    <table><thead><tr><th>Método</th><th>Aulas</th><th>Páginas</th><th>Lições</th><th>Conteúdos</th></tr></thead><tbody>
      ${methodRows.length ? methodRows.map((r) => `<tr><td>${r.method}</td><td>${r.count}</td><td>${r.pages}</td><td>${r.lessons}</td><td>${r.content}</td></tr>`).join('') : '<tr><td colspan="5">Sem dados para o período.</td></tr>'}
    </tbody></table>
  </body></html>`;
}
