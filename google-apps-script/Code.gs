/**
 * Google Apps Script - API REST com Inteligência Artificial (Gemini 1.5/2.5 Flash)
 * Planilha: "Bora Mercado"
 */

function getFamilyPin() {
  var pin = PropertiesService.getScriptProperties().getProperty('FAMILY_PIN');
  if (!pin) throw new Error('A propriedade FAMILY_PIN não foi configurada.');
  return String(pin).trim();
}

function getGeminiApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  return key ? String(key).trim() : '';
}

function testGeminiAI() {
  var apiKey = getGeminiApiKey();
  Logger.log("Chave API encontrada: " + (apiKey ? (apiKey.substring(0, 8) + "...") : "NENHUMA CHAVE ENCONTRADA!"));
  if (!apiKey) {
    Logger.log("⚠️ ATENÇÃO: A propriedade GEMINI_API_KEY não foi configurada em Propriedades do Script!");
    return;
  }
  var res = processWithGeminiAI(apiKey, 'remove', 'comprei o rango do bicho', ['cachorro', 'açúcar']);
  Logger.log("🤖 RESPOSTA RETORNADA PELO GEMINI IA: " + JSON.stringify(res));
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

    if (action === 'authorize') return handleAuthorize(ss, userId);
    if (action === 'register') return handleRegister(ss, p.code || '', user, userId);

    var apiKey = getGeminiApiKey();
    if (apiKey && (action === 'add' || action === 'remove' || item)) {
      var aiResult = processWithGeminiAI(apiKey, action, item, getActiveItemsList(itens));
      if (aiResult && aiResult.action) {
        action = aiResult.action;
        if (aiResult.item) item = aiResult.item;
      }
    }

    if (action === 'list') return handleList(itens);
    if (action === 'add') return handleAdd(itens, item, user, userId);
    if (action === 'remove') return handleRemove(itens, historico, item, user, userId);
    
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

function getActiveItemsList(sheet) {
  var data = sheet.getDataRange().getValues(), items = [];
  for (var i = 1; i < data.length; i++) if (data[i][0] && String(data[i][4]).toUpperCase() === 'ATIVO') items.push(String(data[i][0]).trim());
  return items;
}

function processWithGeminiAI(apiKey, actionHint, userInput, activeItems) {
  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
    var prompt = "Você é um assistente de inteligência artificial de lista de supermercado familiar.\n" +
      "Itens atualmente ATIVOS na lista de compras: " + JSON.stringify(activeItems) + "\n" +
      "Ação sugerida da Alexa: '" + actionHint + "'\n" +
      "Frase ou item dito pelo usuário: '" + userInput + "'\n\n" +
      "Sua tarefa:\n" +
      "1. Se o usuário quiser ADICIONAR ou ANOTAR algo, identifique o nome limpo e singular do item (ex: 'leite', 'pão', 'cachorro') e retorne {\"action\": \"add\", \"item\": \"nome_do_item\"}.\n" +
      "2. Se o usuário quiser REMOVER, RISCAR, DAR BAIXA ou COMPROU algo (ex: 'comprei a ração do bicho', 'tira o cão', 'risca o leite'), identifique qual item da lista ativa corresponde (ex: 'cachorro') e retorne {\"action\": \"remove\", \"item\": \"item_correspondente_da_lista\"}.\n" +
      "3. Se o usuário quiser CONSULTAR o que falta, retorne {\"action\": \"list\", \"item\": \"\"}.\n" +
      "Responda EXCLUSIVAMENTE um objeto JSON válido no formato {\"action\": \"...\", \"item\": \"...\"} sem marcações markdown extra.";

    var payload = {
      "contents": [{"parts": [{"text": prompt}]}],
      "generationConfig": {"response_mime_type": "application/json"}
    };

    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    var res = UrlFetchApp.fetch(url, options);
    var jsonText = res.getContentText();
    var parsed = JSON.parse(jsonText);
    var replyText = parsed.candidates[0].content.parts[0].text;
    return JSON.parse(replyText);
  } catch (e) {
    Logger.log("Erro no Gemini AI: " + e);
    return null;
  }
}

function handleList(sheet) {
  var items = getActiveItemsList(sheet);
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
    if ((current === target || current.indexOf(target) !== -1 || target.indexOf(current) !== -1) && String(data[i][4]).toUpperCase() === 'ATIVO') {
      historico.appendRow([data[i][0], date, user, userId, data[i][1], data[i][2], data[i][3]]);
      itens.getRange(i + 1, 5, 1, 4).setValues([['REMOVIDO', date, user, userId]]);
      return responseJSON({ success: true, item: data[i][0] });
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
