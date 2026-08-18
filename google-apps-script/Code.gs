/**
 * Google Apps Script - API REST para a Skill Alexa "Bora Mercado"
 *
 * Planilha do Google: "Bora Mercado"
 *
 * ABA "Itens"
 * ─────────────────────────────────────────────────────────────
 * Item
 * Data Inclusão
 * Quem Incluiu
 * User ID Alexa (Incluiu)
 * Status
 * Data Remoção
 * Quem Apagou
 * User ID Alexa (Apagou)
 *
 *
 * ABA "Historico_Removidos"
 * ─────────────────────────────────────────────────────────────
 * Item
 * Data Remoção
 * Quem Apagou
 * User ID Alexa (Apagou)
 * Data Inclusão
 * Quem Incluiu
 * User ID Alexa (Incluiu)
 *
 *
 * A remoção utiliza SOFT DELETE:
 *
 * - A linha original nunca é apagada da aba "Itens".
 * - O Status passa de ATIVO para REMOVIDO.
 * - Os dados da inclusão são preservados.
 * - Os dados da remoção são registrados.
 * - Uma cópia completa da operação é registrada em
 *   "Historico_Removidos".
 *
 *
 * Compatibilidade:
 *
 * O código também migra automaticamente a estrutura antiga
 * das abas, sem apagar os registros existentes.
 */


// ============================================================
// API PRINCIPAL
// ============================================================

function doGet(e) {

  try {

    var params = e.parameter || {};

    var action = (params.action || 'list').toLowerCase();

    var item = params.item
      ? params.item.trim()
      : '';

    var user = params.user
      ? params.user.trim()
      : 'Desconhecido';

    var userId = params.userId
      ? params.userId.trim()
      : '';


    var ss = SpreadsheetApp.getActiveSpreadsheet();


    // Obtém/cria as abas
    var sheetItens =
      getOrCreateSheet(ss, 'Itens');

    var sheetRemovidos =
      getOrCreateSheet(ss, 'Historico_Removidos');


    // Garante que as estruturas estejam corretas.
    // Também faz a migração da versão antiga, se necessário.
    ensureSheetStructure(
      sheetItens,
      'Itens'
    );

    ensureSheetStructure(
      sheetRemovidos,
      'Historico_Removidos'
    );


    // ========================================================
    // LIST
    // ========================================================

    if (action === 'list') {

      return handleList(
        sheetItens
      );
    }


    // ========================================================
    // ADD
    // ========================================================

    else if (action === 'add') {

      return handleAdd(
        sheetItens,
        item,
        user,
        userId
      );
    }


    // ========================================================
    // REMOVE
    // ========================================================

    else if (action === 'remove') {

      return handleRemove(
        sheetItens,
        sheetRemovidos,
        item,
        user,
        userId
      );
    }


    // ========================================================
    // AÇÃO INVÁLIDA
    // ========================================================

    else {

      return responseJSON({
        success: false,
        message:
          'Ação inválida. Use: list, add ou remove.'
      });
    }


  } catch (error) {

    return responseJSON({
      success: false,
      error: error.toString()
    });
  }
}



// ============================================================
// CRIAÇÃO DAS ABAS
// ============================================================

function getOrCreateSheet(
  ss,
  sheetName
) {

  var sheet =
    ss.getSheetByName(sheetName);


  if (!sheet) {

    sheet =
      ss.insertSheet(sheetName);
  }


  return sheet;
}



// ============================================================
// GARANTE A ESTRUTURA DAS ABAS
// ============================================================

function ensureSheetStructure(
  sheet,
  sheetName
) {


  // ==========================================================
  // ABA ITENS
  // ==========================================================

  if (sheetName === 'Itens') {


    var headersItens = [

      'Item',

      'Data Inclusão',

      'Quem Incluiu',

      'User ID Alexa (Incluiu)',

      'Status',

      'Data Remoção',

      'Quem Apagou',

      'User ID Alexa (Apagou)'

    ];


    // --------------------------------------------------------
    // Planilha completamente vazia
    // --------------------------------------------------------

    if (sheet.getLastRow() === 0) {

      sheet
        .getRange(
          1,
          1,
          1,
          headersItens.length
        )
        .setValues([
          headersItens
        ]);


      sheet
        .getRange(
          1,
          1,
          1,
          headersItens.length
        )
        .setFontWeight('bold');


      return;
    }


    // --------------------------------------------------------
    // Garante que existam 8 colunas
    // --------------------------------------------------------

    if (sheet.getMaxColumns() < 8) {

      sheet.insertColumnsAfter(

        sheet.getMaxColumns(),

        8 - sheet.getMaxColumns()

      );
    }


    // --------------------------------------------------------
    // Detecta a estrutura antiga
    //
    // Antiga:
    //
    // A Item
    // B Data Inclusão
    // C Quem Incluiu
    // D User ID Alexa
    //
    // Nova:
    //
    // A Item
    // B Data Inclusão
    // C Quem Incluiu
    // D User ID Alexa (Incluiu)
    // E Status
    // F Data Remoção
    // G Quem Apagou
    // H User ID Alexa (Apagou)
    // --------------------------------------------------------

    var oldHeaderD =
      sheet.getRange(1, 4).getValue();


    var oldHeaderE =
      sheet.getRange(1, 5).getValue();


    var oldHeaderH =
      sheet.getRange(1, 8).getValue();


    var isOldStructure =
      oldHeaderD === 'User ID Alexa' &&
      oldHeaderE === '' &&
      oldHeaderH === '';


    // --------------------------------------------------------
    // Atualiza cabeçalho
    // --------------------------------------------------------

    sheet
      .getRange(
        1,
        1,
        1,
        headersItens.length
      )
      .setValues([
        headersItens
      ]);


    sheet
      .getRange(
        1,
        1,
        1,
        headersItens.length
      )
      .setFontWeight('bold');


    // --------------------------------------------------------
    // Registros existentes
    // --------------------------------------------------------

    if (sheet.getLastRow() > 1) {

      var lastRow =
        sheet.getLastRow();


      // ------------------------------------------------------
      // Se era a estrutura antiga, os dados da coluna D
      // já estão exatamente no lugar correto.
      //
      // Portanto, basta adicionar o Status = ATIVO.
      // ------------------------------------------------------

      for (
        var row = 2;
        row <= lastRow;
        row++
      ) {

        var status =
          sheet
            .getRange(row, 5)
            .getValue();


        if (
          !status ||
          status
            .toString()
            .trim() === ''
        ) {

          sheet
            .getRange(row, 5)
            .setValue('ATIVO');
        }
      }
    }


    return;
  }



  // ==========================================================
  // ABA HISTORICO_REMOVIDOS
  // ==========================================================

  if (
    sheetName ===
    'Historico_Removidos'
  ) {


    var headersHistorico = [

      'Item',

      'Data Remoção',

      'Quem Apagou',

      'User ID Alexa (Apagou)',

      'Data Inclusão',

      'Quem Incluiu',

      'User ID Alexa (Incluiu)'

    ];


    // --------------------------------------------------------
    // Planilha completamente vazia
    // --------------------------------------------------------

    if (sheet.getLastRow() === 0) {

      sheet
        .getRange(
          1,
          1,
          1,
          headersHistorico.length
        )
        .setValues([
          headersHistorico
        ]);


      sheet
        .getRange(
          1,
          1,
          1,
          headersHistorico.length
        )
        .setFontWeight('bold');


      return;
    }


    // --------------------------------------------------------
    // Garante 7 colunas
    // --------------------------------------------------------

    if (sheet.getMaxColumns() < 7) {

      sheet.insertColumnsAfter(

        sheet.getMaxColumns(),

        7 - sheet.getMaxColumns()

      );
    }


    // --------------------------------------------------------
    // Detecta a estrutura ANTIGA
    //
    // Antiga:
    //
    // A Item
    // B Data Remoção
    // C Quem Apagou
    // D Data Inclusão
    // E Quem Incluiu
    //
    // Nova:
    //
    // A Item
    // B Data Remoção
    // C Quem Apagou
    // D User ID Alexa (Apagou)
    // E Data Inclusão
    // F Quem Incluiu
    // G User ID Alexa (Incluiu)
    // --------------------------------------------------------

    var headerD =
      sheet.getRange(1, 4).getValue();


    var headerE =
      sheet.getRange(1, 5).getValue();


    var isOldHistoryStructure =
      headerD === 'Data Inclusão' &&
      headerE === 'Quem Incluiu';


    // --------------------------------------------------------
    // MIGRAÇÃO DOS DADOS ANTIGOS
    // --------------------------------------------------------

    if (
      isOldHistoryStructure &&
      sheet.getLastRow() > 1
    ) {


      var lastRowHistorico =
        sheet.getLastRow();


      var oldData =
        sheet
          .getRange(
            2,
            1,
            lastRowHistorico - 1,
            5
          )
          .getValues();


      var newData = [];


      for (
        var i = 0;
        i < oldData.length;
        i++
      ) {

        newData.push([

          // A - Item
          oldData[i][0],

          // B - Data Remoção
          oldData[i][1],

          // C - Quem Apagou
          oldData[i][2],

          // D - User ID Alexa (Apagou)
          // Não existia na versão antiga
          '',

          // E - Data Inclusão
          oldData[i][3],

          // F - Quem Incluiu
          oldData[i][4],

          // G - User ID Alexa (Incluiu)
          // Não existia na versão antiga
          ''

        ]);
      }


      // Limpa os dados antigos
      sheet
        .getRange(
          2,
          1,
          lastRowHistorico - 1,
          7
        )
        .clearContent();


      // Grava os dados já reorganizados
      sheet
        .getRange(
          2,
          1,
          newData.length,
          7
        )
        .setValues(
          newData
        );
    }


    // --------------------------------------------------------
    // Atualiza cabeçalho
    // --------------------------------------------------------

    sheet
      .getRange(
        1,
        1,
        1,
        headersHistorico.length
      )
      .setValues([
        headersHistorico
      ]);


    sheet
      .getRange(
        1,
        1,
        1,
        headersHistorico.length
      )
      .setFontWeight('bold');


    return;
  }
}



// ============================================================
// LISTAR ITENS ATIVOS
// ============================================================

function handleList(
  sheet
) {


  var data =
    sheet
      .getDataRange()
      .getValues();


  var items = [];


  // ----------------------------------------------------------
  // Pula o cabeçalho
  // ----------------------------------------------------------

  for (
    var i = 1;
    i < data.length;
    i++
  ) {


    var cellValue =
      data[i][0];


    if (
      cellValue &&
      cellValue
        .toString()
        .trim() !== ''
    ) {


      // Coluna E = Status
      var status =
        data[i][4];


      // Compatibilidade com registros antigos:
      // se não tiver status, considera ATIVO.
      if (
        !status ||
        status
          .toString()
          .trim() === ''
      ) {

        status = 'ATIVO';
      }


      // ------------------------------------------------------
      // Só retorna itens ATIVOS
      // ------------------------------------------------------

      if (
        status
          .toString()
          .trim()
          .toUpperCase() ===
        'ATIVO'
      ) {

        items.push(
          cellValue
            .toString()
            .trim()
        );
      }
    }
  }


  return responseJSON({

    success: true,

    count: items.length,

    items: items

  });
}



// ============================================================
// ADICIONAR ITEM
// ============================================================

function handleAdd(
  sheet,
  item,
  user,
  userId
) {


  if (!item) {

    return responseJSON({

      success: false,

      message:
        'Nenhum item informado para adicionar.'

    });
  }


  var now =
    new Date();


  var formattedDate =
    Utilities.formatDate(

      now,

      Session.getScriptTimeZone(),

      'dd/MM/yyyy HH:mm:ss'

    );


  // ----------------------------------------------------------
  // Cria novo registro como ATIVO
  // ----------------------------------------------------------

  sheet.appendRow([

    item,

    formattedDate,

    user,

    userId,

    'ATIVO',

    '',

    '',

    ''

  ]);


  return responseJSON({

    success: true,

    message:
      'Item "' +
      item +
      '" anotado por ' +
      user +
      '.',

    item: item,

    user: user

  });
}



// ============================================================
// REMOVER ITEM - SOFT DELETE
// ============================================================

function handleRemove(
  sheetItens,
  sheetRemovidos,
  item,
  user,
  userId
) {


  if (!item) {

    return responseJSON({

      success: false,

      message:
        'Nenhum item informado para remover.'

    });
  }


  var data =
    sheetItens
      .getDataRange()
      .getValues();


  var targetItem =
    item
      .toLowerCase();


  var now =
    new Date();


  var formattedDate =
    Utilities.formatDate(

      now,

      Session.getScriptTimeZone(),

      'dd/MM/yyyy HH:mm:ss'

    );


  // ----------------------------------------------------------
  // Percorre de baixo para cima
  //
  // Mantém o comportamento original caso existam
  // itens duplicados.
  // ----------------------------------------------------------

  for (
    var i = data.length - 1;
    i >= 1;
    i--
  ) {


    var rowValue =
      data[i][0]
        ? data[i][0]
            .toString()
            .trim()
            .toLowerCase()
        : '';


    // --------------------------------------------------------
    // Status atual
    // --------------------------------------------------------

    var status =
      data[i][4];


    // Registros antigos sem Status são considerados ATIVOS.
    if (
      !status ||
      status
        .toString()
        .trim() === ''
    ) {

      status = 'ATIVO';
    }


    // --------------------------------------------------------
    // Só remove se:
    //
    // 1. O item for igual
    // 2. O item estiver ATIVO
    // --------------------------------------------------------

    if (

      rowValue === targetItem &&

      status
        .toString()
        .trim()
        .toUpperCase() ===
      'ATIVO'

    ) {


      // ======================================================
      // DADOS ORIGINAIS DA INCLUSÃO
      // ======================================================

      var itemOriginal =
        data[i][0] || 'N/I';


      var dataInclusao =
        data[i][1] || 'N/I';


      var quemIncluiu =
        data[i][2] || 'N/I';


      var userIdIncluiu =
        data[i][3] || 'N/I';



      // ======================================================
      // DADOS DA REMOÇÃO
      // ======================================================

      var quemApagou =
        user || 'Desconhecido';


      var userIdApagou =
        userId || 'N/I';



      // ======================================================
      // 1. GRAVA NO HISTÓRICO
      // ======================================================

      sheetRemovidos.appendRow([

        // Item
        itemOriginal,

        // Data Remoção
        formattedDate,

        // Quem Apagou
        quemApagou,

        // User ID Alexa (Apagou)
        userIdApagou,

        // Data Inclusão
        dataInclusao,

        // Quem Incluiu
        quemIncluiu,

        // User ID Alexa (Incluiu)
        userIdIncluiu

      ]);



      // ======================================================
      // 2. SOFT DELETE NA ABA ITENS
      // ======================================================

      // O +1 é necessário porque o array começa em zero
      // e a planilha começa na linha 1.
      var sheetRow =
        i + 1;


      // ------------------------------------------------------
      // Coluna E = Status
      // ------------------------------------------------------

      sheetItens
        .getRange(
          sheetRow,
          5
        )
        .setValue(
          'REMOVIDO'
        );


      // ------------------------------------------------------
      // Coluna F = Data Remoção
      // ------------------------------------------------------

      sheetItens
        .getRange(
          sheetRow,
          6
        )
        .setValue(
          formattedDate
        );


      // ------------------------------------------------------
      // Coluna G = Quem Apagou
      // ------------------------------------------------------

      sheetItens
        .getRange(
          sheetRow,
          7
        )
        .setValue(
          quemApagou
        );


      // ------------------------------------------------------
      // Coluna H = User ID Alexa (Apagou)
      // ------------------------------------------------------

      sheetItens
        .getRange(
          sheetRow,
          8
        )
        .setValue(
          userIdApagou
        );



      // ======================================================
      // RESPOSTA
      // ======================================================

      return responseJSON({

        success: true,

        message:
          'Item "' +
          item +
          '" riscado por ' +
          user +
          '.',

        item: item,

        user: user

      });
    }
  }



  // ==========================================================
  // ITEM NÃO ENCONTRADO
  // ==========================================================

  return responseJSON({

    success: false,

    message:
      'Item "' +
      item +
      '" não foi encontrado na lista.',

    item: item

  });
}



// ============================================================
// RESPOSTA JSON
// ============================================================

function responseJSON(
  obj
) {

  return ContentService

    .createTextOutput(
      JSON.stringify(obj)
    )

    .setMimeType(
      ContentService.MimeType.JSON
    );
}