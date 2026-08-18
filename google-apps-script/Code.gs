function getFamilyPin() {
  var pin = PropertiesService.getScriptProperties().getProperty('FAMILY_PIN');
  if (!pin) throw new Error('A propriedade FAMILY_PIN não foi configurada.');
  return String(pin).trim();
}

function doGet(e) {
  try {
    var p = e.parameter || {};
    var action = (p.action || 'list').toLowerCase();
    var item = p.item ? p.item.trim() : '';
    var user = p.user ? p.user.trim() : 'Desconhecido';
    var userId = p.userId ? p.userId.trim() : '';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var itens = getOrCreateSheet(ss, 'Itens');
    var historico = getOrCreateSheet(ss, 'Historico_Removidos');
    ensureItens(itens); ensureHistorico(historico);
    if (action === 'list') return handleList(itens);
    if (action === 'add') return handleAdd(itens, item, user, userId);
    if (action === 'remove') return handleRemove(itens, historico, item, user, userId);
    if (action === 'authorize') return handleAuthorize(ss, userId);
    if (action === 'register') return handleRegister(ss, p.code || '', user, userId);
    return responseJSON({ success: false, message: 'Ação inválida.' });
  } catch (error) { return responseJSON({ success: false, message: error.toString() }); }
}

function getOrCreateSheet(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }
function ensureItens(sheet) {
  var h = ['Item', 'Data Inclusão', 'Quem Incluiu', 'User ID Alexa (Incluiu)', 'Status', 'Data Remoção', 'Quem Apagou', 'User ID Alexa (Apagou)'];
  if (sheet.getMaxColumns() < 8) sheet.insertColumnsAfter(sheet.getMaxColumns(), 8 - sheet.getMaxColumns());
  sheet.getRange(1, 1, 1, 8).setValues([h]).setFontWeight('bold');
  var last = sheet.getLastRow();
  if (last > 1) { var status = sheet.getRange(2, 5, last - 1, 1).getValues(); for (var i = 0; i < status.length; i++) if (!status[i][0]) status[i][0] = 'ATIVO'; sheet.getRange(2, 5, last - 1, 1).setValues(status); }
}
function ensureHistorico(sheet) {
  var h = ['Item', 'Data Remoção', 'Quem Apagou', 'User ID Alexa (Apagou)', 'Data Inclusão', 'Quem Incluiu', 'User ID Alexa (Incluiu)'];
  if (sheet.getMaxColumns() < 7) sheet.insertColumnsAfter(sheet.getMaxColumns(), 7 - sheet.getMaxColumns());
  if (sheet.getLastRow() > 1 && sheet.getRange(1, 4).getValue() === 'Data Inclusão' && sheet.getRange(1, 5).getValue() === 'Quem Incluiu') {
    var old = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues(), migrated = [];
    for (var i = 0; i < old.length; i++) migrated.push([old[i][0], old[i][1], old[i][2], '', old[i][3], old[i][4], '']);
    sheet.getRange(2, 1, old.length, 7).clearContent();
    sheet.getRange(2, 1, migrated.length, 7).setValues(migrated);
  }
  sheet.getRange(1, 1, 1, 7).setValues([h]).setFontWeight('bold');
}
function now() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'); }

function handleList(sheet) {
  var data = sheet.getDataRange().getValues(), items = [];
  for (var i = 1; i < data.length; i++) if (data[i][0] && String(data[i][4]).toUpperCase() === 'ATIVO') items.push(String(data[i][0]).trim());
  return responseJSON({ success: true, count: items.length, items: items });
}
function handleAdd(sheet, item, user, userId) {
  if (!item) return responseJSON({ success: false, message: 'Nenhum item informado.' });
  sheet.appendRow([item, now(), user, userId, 'ATIVO', '', '', '']);
  return responseJSON({ success: true, item: item });
}
function handleRemove(itens, historico, item, user, userId) {
  if (!item) return responseJSON({ success: false, message: 'Nenhum item informado.' });
  var data = itens.getDataRange().getValues(), target = item.toLowerCase().trim(), date = now();
  for (var i = data.length - 1; i >= 1; i--) {
    var current = data[i][0] ? String(data[i][0]).toLowerCase().trim() : '';
    if (current === target && String(data[i][4]).toUpperCase() === 'ATIVO') {
      historico.appendRow([data[i][0], date, user, userId, data[i][1], data[i][2], data[i][3]]);
      itens.getRange(i + 1, 5, 1, 4).setValues([['REMOVIDO', date, user, userId]]);
      return responseJSON({ success: true, item: item });
    }
  }
  return responseJSON({ success: false, message: 'Item não encontrado.' });
}

function getAuthorizedUsersSheet(ss) {
  var sheet = getOrCreateSheet(ss, 'Usuarios_Autorizados');
  if (sheet.getLastRow() === 0) sheet.appendRow(['User ID Alexa', 'Nome', 'Data de Cadastro', 'Status']);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  return sheet;
}
function handleAuthorize(ss, userId) {
  if (!userId) return responseJSON({ success: false });
  var data = getAuthorizedUsersSheet(ss).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) if (String(data[i][0]).trim() === userId && String(data[i][3]).toUpperCase() === 'ATIVO') return responseJSON({ success: true, user: data[i][1] || 'Usuário' });
  return responseJSON({ success: false });
}
function handleRegister(ss, code, user, userId) {
  if (!userId || String(code).trim() !== getFamilyPin()) return responseJSON({ success: false });
  var sheet = getAuthorizedUsersSheet(ss), data = sheet.getDataRange().getValues(), date = now();
  for (var i = 1; i < data.length; i++) if (String(data[i][0]).trim() === userId) { sheet.getRange(i + 1, 2, 1, 3).setValues([[user, date, 'ATIVO']]); return responseJSON({ success: true }); }
  sheet.appendRow([userId, user, date, 'ATIVO']);
  return responseJSON({ success: true });
}
function responseJSON(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
