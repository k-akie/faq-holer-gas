import {Analyze} from './main';

const APP_NAME = 'FAQ-BOT';

export class Sheets {
  static FAQ = 'faq';
  static CONTENT = 'content';
  static HISTORY = 'history';

  static all(): string[] {
    return [Sheets.FAQ, Sheets.CONTENT, Sheets.HISTORY];
  }
}
type SheetName = typeof Sheets.FAQ | typeof Sheets.CONTENT | typeof Sheets.HISTORY;

export class FaqColumn {
  static QUESTION = 1;
  static ANSWER = 2;
  static KEYWORDS = 3;
  static ID = 4;
  static ADDDATE = 5;
}

/** ファイルを開いたときの処理 */
// eslint-disable-next-line no-unused-vars
function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu(APP_NAME);
  menu.addItem('FAQ解析(faq -> content)', 'analyzeFaqAll');
  menu.addItem('初期化(シート作成)', 'initialize');
  menu.addToUi();
}

/** シート取得 */
function getSheetByName(sheetName: SheetName): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (sheet == null) throw Error(`「${sheetName}」というシートが見つかりません`);
  return sheet;
}

export class Spread {
  /** 指定シートの最終行に行データを追加する */
  static insertLineData(sheetName: SheetName, lineData: (string | number | Date)[]) {
    const sheet = getSheetByName(sheetName);
    const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, lineData.length);
    dataRange.setValues([lineData]);
  }

  /** 指定シートの最終行に複数行データを追加する */
  static insertData(sheetName: SheetName, data: (string | number | Date)[][]) {
    const sheet = getSheetByName(sheetName);
    const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, data.length, data[0].length);
    dataRange.setValues(data);
  }

  /** 指定シートの全データを取得する */
  static selectAllData(sheetName: SheetName): any[][] {
    const sheet = getSheetByName(sheetName);
    return sheet.getDataRange().getValues();
  }
}

/**
 * 検索用FAQデータを更新(すべて)
 * faqシート(コマンドや手で追加・更新がありうる) -> contentシート(スクリプトで上書き更新する)
 */
// eslint-disable-next-line no-unused-vars
function analyzeFaqAll() {
  // varidation
  const faqSheet = getSheetByName(Sheets.FAQ);
  const keys = faqSheet.getRange(2, FaqColumn.ID, faqSheet.getLastRow()-1, 1).getValues().map((item) => item[0]);
  if (keys.length != new Set(keys).size) {
    Browser.msgBox(`「${Sheets.FAQ}」シートのIDは重複しないように設定してください`, Browser.Buttons.OK);
    return;
  }

  // クリア
  const contentSheet = getSheetByName(Sheets.CONTENT);
  contentSheet.getRange(2, 1, contentSheet.getLastRow(), 10).clear(); // 10は適当

  for (let rowNo = 2; rowNo <= faqSheet.getLastRow(); rowNo++) {
    const inputData = faqSheet.getRange(rowNo, FaqColumn.KEYWORDS, 1, 2).getValues()[0];
    const keywords = inputData[0].toString();
    const triggerId = inputData[1].toString();
    Analyze.faq(keywords, triggerId);
  }
}

// eslint-disable-next-line no-unused-vars
function initialize() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  {
    const response = ui.alert(
        `${APP_NAME}用のシートを作成します\n`+
      `${Sheets.all().join(', ')}\n\n`+
      '※既に同じ名前のシートがある場合、シートが再作成されます\n'
        , ui.ButtonSet.OK_CANCEL);
    if (response != ui.Button.OK) {
      return;
    }
  }

  createSheetFaq(book);
  createSheetContent(book);
  createSheetHistory(book);

  {
    const sheets = book.getSheets();
    if (sheets.length == Sheets.all.length) {
      return;
    }
    const response = ui.alert(`${APP_NAME}に不要なシートを削除しますか？`, ui.ButtonSet.YES_NO);
    if (response == ui.Button.YES) {
      for (const sheet of sheets) {
        if (Sheets.all().includes(sheet.getName() as SheetName)) {
          continue;
        }
        book.deleteSheet(sheet);
      }
    }
  }
}

function createSheetFaq(book: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const oldSheet = book.getSheetByName(Sheets.FAQ);
  if (oldSheet) {
    book.deleteSheet(oldSheet);
  }

  const sheet = book.insertSheet(Sheets.FAQ);
  const header = ['質問文', '回答文', 'キーワード', 'ID', '登録日時'];
  const dataRange = sheet.getRange(1, 1, 1, header.length);
  dataRange.setValues([header]);

  sheet.getRange(2, FaqColumn.ADDDATE, 1000, 1).setNumberFormat('yyyy/mm/dd h:mm:ss');
}
function createSheetContent(book: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const oldSheet = book.getSheetByName(Sheets.CONTENT);
  if (oldSheet) {
    book.deleteSheet(oldSheet);
  }

  const sheet = book.insertSheet(Sheets.CONTENT);
  const header = ['keyword', 'ID'];
  const dataRange = sheet.getRange(1, 1, 1, header.length);
  dataRange.setValues([header]);
  const protection = sheet.protect().setDescription('Sample protected sheet');
  protection.removeEditors(protection.getEditors());
}
function createSheetHistory(book: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const oldSheet = book.getSheetByName(Sheets.HISTORY);
  if (oldSheet) {
    book.deleteSheet(oldSheet);
  }

  const sheet = book.insertSheet(Sheets.HISTORY);
  const header = ['質問文', '回答ID', '質問日時'];
  const dataRange = sheet.getRange(1, 1, 1, header.length);
  dataRange.setValues([header]);

  sheet.getRange(2, 3, 1000, 1).setNumberFormat('yyyy/mm/dd h:mm:ss');
}
