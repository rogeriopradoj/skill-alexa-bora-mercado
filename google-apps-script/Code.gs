/**
 * Google Apps Script - API REST para a Skill Alexa "Bora Mercado" (com Governança)
 * Planilha do Google: "Bora Mercado"
 * 
 * Abas Criadas Automaticamente:
 * 1. "Itens": [Item, Data Inclusão, Quem Incluiu, User ID Alexa]
 * 2. "Historico_Removidos": [Item, Data Remoção, Quem Apagou, Data Inclusão, Quem Incluiu]
 */

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = (params.action || 'list').toLowerCase();
    var item = params.item ? params.item.trim() : '';
    var user = params.user ? params.user.trim() : 'Desconhecido';
    var userId = params.userId ? params.userId.trim() : '';
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetItens = getOrCreateSheet(ss, 'Itens');
    var sheetRemovidos = getOrCreateSheet(ss, 'Historico_Removidos');

    if (action === 'list') {
      return handleList(sheetItens);
    } else if (action === 'add') {
      return handleAdd(sheetItens, item, user, userId);
    } else if (action === 'remove') {
      return handleRemove(sheetItens, sheetRemovidos, item, user, userId);
    } else {
      return responseJSON({ success: false, message: 'Ação inválida. Use: list, add ou remove.' });
    }
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Itens') {
      sheet.appendRow(['Item', 'Data Inclusão', 'Quem Incluiu', 'User ID Alexa']);
      sheet.getRange("1:1").setFontWeight("bold");
    } else if (sheetName === 'Historico_Removidos') {
      sheet.appendRow(['Item', 'Data Remoção', 'Quem Apagou', 'Data Inclusão', 'Quem Incluiu']);
      sheet.getRange("1:1").setFontWeight("bold");
    }
  }
  return sheet;
}

function handleList(sheet) {
  var data = sheet.getDataRange().getValues();
  var items = [];
  
  // Pula a primeira linha (cabeçalho)
  for (var i = 1; i < data.length; i++) {
    var cellValue = data[i][0];
    if (cellValue && cellValue.toString().trim() !== '') {
      items.push(cellValue.toString().trim());
    }
  }
  
  return responseJSON({
    success: true,
    count: items.length,
    items: items
  });
}

function handleAdd(sheet, item, user, userId) {
  if (!item) {
    return responseJSON({ success: false, message: 'Nenhum item informado para adicionar.' });
  }
  
  var now = new Date();
  var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  
  sheet.appendRow([item, formattedDate, user, userId]);
  return responseJSON({
    success: true,
    message: 'Item "' + item + '" anotado por ' + user + '.',
    item: item,
    user: user
  });
}

function handleRemove(sheetItens, sheetRemovidos, item, user, userId) {
  if (!item) {
    return responseJSON({ success: false, message: 'Nenhum item informado para remover.' });
  }
  
  var data = sheetItens.getDataRange().getValues();
  var targetItem = item.toLowerCase();
  var now = new Date();
  var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  
  for (var i = data.length - 1; i >= 1; i--) {
    var rowValue = data[i][0] ? data[i][0].toString().trim().toLowerCase() : '';
    if (rowValue === targetItem) {
      var dataInclusao = data[i][1] || 'N/I';
      var quemIncluiu = data[i][2] || 'N/I';
      
      // Registra o apagamento na aba de Histórico
      sheetRemovidos.appendRow([data[i][0], formattedDate, user, dataInclusao, quemIncluiu]);
      
      // Deleta o item da aba de itens ativos
      sheetItens.deleteRow(i + 1);
      
      return responseJSON({
        success: true,
        message: 'Item "' + item + '" riscado por ' + user + '.',
        item: item,
        user: user
      });
    }
  }
  
  return responseJSON({
    success: false,
    message: 'Item "' + item + '" não foi encontrado na lista.',
    item: item
  });
}

function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
