import { analyzeFaq } from "./main";

export const APP_NAME = 'FAQ-BOT';

export const SheetName = {
  FAQ: 'faq',
  CONTENT: 'content', 
  HISTORY: 'history',
} as const;
type SheetName = typeof SheetName[keyof typeof SheetName]
const AllSheets = Object.values(SheetName);

export const FaqColumn = {
  QUESTION: 1,
  ANSWER: 2,
  KEYWORDS: 3,
  ID: 4,
  ADDDATE: 5,
}

/** ファイルを開いたときの処理 */
function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu(APP_NAME);
  menu.addItem('FAQ解析(faq -> content)', 'analyzeFaqAll');
  menu.addItem('初期化(シート作成)', 'initialize');
  menu.addToUi();
}

/** シート取得 */
function getSheetByName(sheetName: SheetName): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if(sheet == null) throw Error(`「${sheetName}」というシートが見つかりません`);
  return sheet;
}

/** 指定シートの最終行にデータを追加する */
export function insertLineData(sheetName: SheetName, lineData: (string | number | Date)[]) {
  const sheet = getSheetByName(sheetName);
  const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, lineData.length);
  dataRange.setValues([lineData]);
}

/** 指定シートの全データを取得する */
export function selectAllData(sheetName: SheetName): any[][] {
  const sheet = getSheetByName(sheetName);
  return sheet.getDataRange().getValues();
}

/**
 * 検索用FAQデータを更新(すべて)
 * faqシート(コマンドや手で追加・更新がありうる) -> contentシート(スクリプトで上書き更新する)
 */
function analyzeFaqAll(){
  const contentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SheetName.CONTENT);
  if (contentSheet == null) return; // FIXME エラーハンドリングする
  contentSheet.getRange(2, 1, contentSheet.getLastRow(), 10).clear(); // 10は適当

  const faqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SheetName.FAQ);
  if (faqSheet == null) return; // FIXME エラーハンドリングする
  // varidation
  const keys = faqSheet.getRange(2, FaqColumn.ID, faqSheet.getLastRow()-1, 1).getValues().map(item => item[0]);
  if(keys.length != new Set(keys).size){
    Browser.msgBox(`「${SheetName.FAQ}」シートのIDは重複しないように設定してください`, Browser.Buttons.OK);
    return;
  }

  for(var rowNo = 2; rowNo <= faqSheet.getLastRow(); rowNo++){
    const inputData = faqSheet.getRange(rowNo, FaqColumn.KEYWORDS, 1, 2).getValues()[0];
    const keywords = inputData[0].toString();
    const trigger_id = inputData[1].toString();
    analyzeFaq(keywords, trigger_id);
  }
}

function initialize() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  {
    const response = ui.alert(
      `${APP_NAME}用のシートを作成します\n`+
      `${AllSheets.join(', ')}\n\n`+
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
    if(sheets.length == AllSheets.length){
      return;
    }
    const response = ui.alert(`${APP_NAME}に不要なシートを削除しますか？`, ui.ButtonSet.YES_NO);
    if(response == ui.Button.YES){
      for(const sheet of sheets){
        if(AllSheets.includes(sheet.getName() as SheetName)){
          continue;
        }
        book.deleteSheet(sheet);
      }
    }
  }
}

function createSheetFaq(book: GoogleAppsScript.Spreadsheet.Spreadsheet){
    const oldSheet = book.getSheetByName(SheetName.FAQ);
    if(oldSheet){
      book.deleteSheet(oldSheet);
    }
    
    const sheet = book.insertSheet(SheetName.FAQ);
    const header = ['質問文', '回答文', 'キーワード', 'ID', '登録日時'];
    const dataRange = sheet.getRange(1, 1, 1, header.length);
    dataRange.setValues([header]);

    sheet.getRange(2, FaqColumn.ADDDATE, 1000, 1).setNumberFormat("yyyy/mm/dd h:mm:ss");
}
function createSheetContent(book: GoogleAppsScript.Spreadsheet.Spreadsheet){
    const oldSheet = book.getSheetByName(SheetName.CONTENT);
    if(oldSheet){
      book.deleteSheet(oldSheet);
    }

    const sheet = book.insertSheet(SheetName.CONTENT);
    const header = ['keyword', 'ID'];
    const dataRange = sheet.getRange(1, 1, 1, header.length);
    dataRange.setValues([header]);
    const protection = sheet.protect().setDescription('Sample protected sheet');
    protection.removeEditors(protection.getEditors());
}
function createSheetHistory(book: GoogleAppsScript.Spreadsheet.Spreadsheet){
    const oldSheet = book.getSheetByName(SheetName.HISTORY);
    if(oldSheet){
      book.deleteSheet(oldSheet);
    }

    const sheet = book.insertSheet(SheetName.HISTORY);
    const header = ['質問文', '回答ID', '質問日時'];
    const dataRange = sheet.getRange(1, 1, 1, header.length);
    dataRange.setValues([header]);

    sheet.getRange(2, 3, 1000, 1).setNumberFormat("yyyy/mm/dd h:mm:ss");
}