/**
 * Google Apps Script - API REST para Lista de Compras compartilhada na Alexa
 * 
 * Configuração de Implantação:
 * - Tipo: App da Web (Web App)
 * - Executar como: Eu
 * - Quem tem acesso: Qualquer pessoa (Anyone)
 */

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = (params.action || 'list').toLowerCase();
    var item = params.item ? params.item.trim() : '';
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (action === 'list') {
      return handleList(sheet);
    } else if (action === 'add') {
      return handleAdd(sheet, item);
    } else if (action === 'remove') {
      return handleRemove(sheet, item);
    } else {
      return responseJSON({ success: false, message: 'Ação inválida. Use: list, add ou remove.' });
    }
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
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

function handleAdd(sheet, item) {
  if (!item) {
    return responseJSON({ success: false, message: 'Nenhum item informado para adicionar.' });
  }
  
  sheet.appendRow([item, new Date()]);
  return responseJSON({
    success: true,
    message: 'Item "' + item + '" adicionado com sucesso.',
    item: item
  });
}

function handleRemove(sheet, item) {
  if (!item) {
    return responseJSON({ success: false, message: 'Nenhum item informado para remover.' });
  }
  
  var data = sheet.getDataRange().getValues();
  var targetItem = item.toLowerCase();
  
  for (var i = data.length - 1; i >= 1; i--) {
    var rowValue = data[i][0] ? data[i][0].toString().trim().toLowerCase() : '';
    if (rowValue === targetItem) {
      sheet.deleteRow(i + 1); // 1-indexed no Sheets
      return responseJSON({
        success: true,
        message: 'Item "' + item + '" removido com sucesso.',
        item: item
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
