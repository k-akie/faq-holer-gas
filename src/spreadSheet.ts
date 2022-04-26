import { analyzeFaq } from "./main";

export const APP_NAME = 'FAQ-BOT';

export const FAQ_SHEET = 'faq';
export const FAQ_COLUMN_QUESTION = 1;
export const FAQ_COLUMN_ANSWER = 2;
export const FAQ_COLUMN_KEYWORDS = 3;
export const FAQ_COLUMN_ID = 4;
export const FAQ_COLUMN_ADDDATE = 5;

export const CONTENT_SHEET = 'content';
export const HISTORY_SHEET = 'history';

/** ファイルを開いたときの処理 */
function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu(APP_NAME);
  menu.addItem('FAQ解析(faq -> content)', 'analyzeFaqAll');
  menu.addItem('初期化(シート作成)', 'initialize');
  menu.addToUi();
}

/**
 * 検索用FAQデータを更新(すべて)
 * faqシート(コマンドや手で追加・更新がありうる) -> contentシート(スクリプトで上書き更新する)
 */
function analyzeFaqAll(){
  const contentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if (contentSheet == null) return; // FIXME エラーハンドリングする
  contentSheet.getRange(2, 1, contentSheet.getLastRow(), 10).clear(); // 10は適当

  const faqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAQ_SHEET);
  if (faqSheet == null) return; // FIXME エラーハンドリングする
  // varidation
  const keys = faqSheet.getRange(2, FAQ_COLUMN_ID, faqSheet.getLastRow()-1, 1).getValues().map(item => item[0]);
  if(keys.length != new Set(keys).size){
    Browser.msgBox(`「${FAQ_SHEET}」シートのIDは重複しないように設定してください`, Browser.Buttons.OK);
    return;
  }

  for(var rowNo = 2; rowNo <= faqSheet.getLastRow(); rowNo++){
    const inputData = faqSheet.getRange(rowNo, FAQ_COLUMN_KEYWORDS, 1, 2).getValues()[0];
    const keywords = inputData[0].toString();
    const trigger_id = inputData[1].toString();
    analyzeFaq(keywords, trigger_id);
  }
}

function initialize() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const requireSheetName = [FAQ_SHEET, CONTENT_SHEET, HISTORY_SHEET];

  {
    const response = ui.alert(
      `${APP_NAME}用のシートを作成します\n`+
      `${requireSheetName.join(', ')}\n\n`+
      '※既に同じ名前のシートがある場合、シートが再作成されます\n'
      , ui.ButtonSet.OK_CANCEL);
    if(response != ui.Button.OK){
      return;
    }
  }

  createSheetFaq(book);
  createSheetContent(book);
  createSheetHistory(book);

  {
    const sheets = book.getSheets();
    if(sheets.length == requireSheetName.length){
      return;
    }
    const response = ui.alert(`${APP_NAME}に不要なシートを削除しますか？`, ui.ButtonSet.YES_NO);
    if(response == ui.Button.YES){
      for(const sheet of sheets){
        if(requireSheetName.includes(sheet.getName())){
          continue;
        }
        book.deleteSheet(sheet);
      }
    }
  }
}

function createSheetFaq(book: GoogleAppsScript.Spreadsheet.Spreadsheet){
    const oldSheet = book.getSheetByName(FAQ_SHEET);
    if(oldSheet){
      book.deleteSheet(oldSheet);
    }
    
    const sheet = book.insertSheet(FAQ_SHEET);
    const header = ['質問文', '回答文', 'キーワード', 'ID', '登録日時'];
    const dataRange = sheet.getRange(1, 1, 1, header.length);
    dataRange.setValues([header]);

    sheet.getRange(2, FAQ_COLUMN_ADDDATE, 1000, 1).setNumberFormat("yyyy/mm/dd h:mm:ss");
}
function createSheetContent(book: GoogleAppsScript.Spreadsheet.Spreadsheet){
    const oldSheet = book.getSheetByName(CONTENT_SHEET);
    if(oldSheet){
      book.deleteSheet(oldSheet);
    }

    const sheet = book.insertSheet(CONTENT_SHEET);
    const header = ['keyword', 'ID'];
    const dataRange = sheet.getRange(1, 1, 1, header.length);
    dataRange.setValues([header]);
    const protection = sheet.protect().setDescription('Sample protected sheet');
    protection.removeEditors(protection.getEditors());
}
function createSheetHistory(book: GoogleAppsScript.Spreadsheet.Spreadsheet){
    const oldSheet = book.getSheetByName(HISTORY_SHEET);
    if(oldSheet){
      book.deleteSheet(oldSheet);
    }

    const sheet = book.insertSheet(HISTORY_SHEET);
    const header = ['質問文', '回答ID', '質問日時'];
    const dataRange = sheet.getRange(1, 1, 1, header.length);
    dataRange.setValues([header]);

    sheet.getRange(2, 3, 1000, 1).setNumberFormat("yyyy/mm/dd h:mm:ss");
}