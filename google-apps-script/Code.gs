/**
 * Google Apps Script - API REST com IA Gemini 3.6 Flash
 * Planilha: "Bora Mercado"
 *
 * Estrutura das Abas:
 * 1. "Itens": [Item, Data Inclusão, Quem Incluiu, User ID Alexa (Incluiu)] -> Apenas 4 Colunas
 * 2. "Historico_Removidos": [Item, Data Remoção, Quem Apagou, User ID Alexa (Apagou), Data Inclusão, Quem Incluiu, User ID Alexa (Incluiu)] -> 7 Colunas
 */

function getGeminiApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  return key ? String(key).trim() : '';
}

function authorizeUrlFetch() {
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + getGeminiApiKey());
  Logger.log("Autorização concedida com sucesso! Resposta: " + res.getResponseCode());
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
  var h = ['Item', 'Data Inclusão', 'Quem Incluiu', 'User ID Alexa (Incluiu)'];
  sheet.getRange(1, 1, 1, 4).setValues([h]).setFontWeight('bold');
}

function ensureHistorico(sheet) {
  var h = ['Item', 'Data Remoção', 'Quem Apagou', 'User ID Alexa (Apagou)', 'Data Inclusão', 'Quem Incluiu', 'User ID Alexa (Incluiu)'];
  sheet.getRange(1, 1, 1, 7).setValues([h]).setFontWeight('bold');
}

function now() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'); }

function getActiveItemsList(sheet) {
  var data = sheet.getDataRange().getValues(), items = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && String(data[i][0]).trim() !== '') {
      items.push(String(data[i][0]).trim());
    }
  }
  return items;
}

function processWithGeminiAI(apiKey, actionHint, userInput, activeItems) {
  var models = ['gemini-3.6-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash'];
  for (var m = 0; m < models.length; m++) {
    try {
      var modelName = models[m];
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + apiKey;
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
      
      if (parsed.error) {
        Logger.log("Aviso no modelo " + modelName + ": " + JSON.stringify(parsed.error));
        continue;
      }
      
      if (parsed.candidates && parsed.candidates.length > 0 && parsed.candidates[0].content) {
        var replyText = parsed.candidates[0].content.parts[0].text;
        return JSON.parse(replyText);
      }
    } catch (e) {
      Logger.log("Erro no Gemini AI com " + models[m] + ": " + e);
    }
  }
  return null;
}

function handleList(sheet) {
  var items = getActiveItemsList(sheet);
  return responseJSON({ success: true, count: items.length, items: items });
}

function handleAdd(sheet, item, user, userId) {
  if (!item) return responseJSON({ success: false, message: 'Nenhum item informado.' });
  sheet.appendRow([item, now(), user, userId]);
  return responseJSON({ success: true, item: item });
}

function handleRemove(itens, historico, item, user, userId) {
  if (!item) return responseJSON({ success: false, message: 'Nenhum item informado.' });
  var data = itens.getDataRange().getValues(), target = item.toLowerCase().trim(), date = now();
  for (var i = data.length - 1; i >= 1; i--) {
    var current = data[i][0] ? String(data[i][0]).toLowerCase().trim() : '';
    if ((current === target || current.indexOf(target) !== -1 || target.indexOf(current) !== -1)) {
      var itemOriginal = data[i][0];
      var dataInclusao = data[i][1] || 'N/I';
      var quemIncluiu = data[i][2] || 'N/I';
      var userIdIncluiu = data[i][3] || 'N/I';
      
      historico.appendRow([itemOriginal, date, user, userId, dataInclusao, quemIncluiu, userIdIncluiu]);
      itens.deleteRow(i + 1);
      return responseJSON({ success: true, item: itemOriginal });
    }
  }
  return responseJSON({ success: false, message: 'Item não encontrado.' });
}

function responseJSON(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
