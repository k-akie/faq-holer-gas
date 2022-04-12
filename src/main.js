const FAQ_SHEET = 'faq';
const FAQ_COLUMN_QUESTION = 1;
const FAQ_COLUMN_ANSWER = 2;
const FAQ_COLUMN_KEYWORDS = 3;
const FAQ_COLUMN_ID = 4;
const FAQ_COLUMN_ADDDATE = 5;

const CONTENT_SHEET = 'content';
const HISTORY_SHEET = 'history';
const CODE_BLOCK = "```";

/** ファイルを開いたときの処理 */
function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu('FAQ-BOT');
  menu.addItem('FAQ解析(faq -> content)', 'analyzeFaqAll');
  menu.addToUi();
}

/** 入り口 */
function doPost(e) {
    const response_url = e.parameter.response_url;
    const text = e.parameter.text.toString();
    ack(response_url, '...確認中...'); // いったんSlackに応答を返す

    // https://api.slack.com/interactivity/slash-commands
    if(e.parameter.command === '/faq-add-gas') {
      const input = text.split(' ');
      if(input.length != 3){
        return ContentService.createTextOutput("`/faq-add-gas [質問文] [回答文] [キーワード(カンマ区切り)]`の形で入力してください");
      }
      const q_text = input[0];
      const a_text = input[1];
      const keywords = input[2];

      const trigger_id = e.parameter.trigger_id.toString();
      addFaq(q_text, a_text, keywords, trigger_id);
      analyzeFaq(keywords, trigger_id);
      return ContentService.createTextOutput(
        `FAQを登録しました :ok_woman:${CODE_BLOCK}\nQ. ${q_text}\nA. ${a_text}\n(${keywords})${CODE_BLOCK}`
        );
    }

    if(e.parameter.command === '/faq-gas') {
      const answerData = searchFaq(text);
      if(answerData.length < FAQ_COLUMN_ID){
        addHistory(text, 'not found');
        return ContentService.createTextOutput(
          `「${text}」という質問に近いFAQをが見つかりませんでした :bow:`+
          '\nキーワードを変えたら見つかるかもしれません'
          );
      }
      addHistory(text, answerData[FAQ_COLUMN_ID]);
      return ContentService.createTextOutput(
        `「${text}」という質問に近いFAQを紹介します`+
        `\n${CODE_BLOCK}Q. ${answerData[FAQ_COLUMN_QUESTION]}`+
        `\nA. ${answerData[FAQ_COLUMN_ANSWER]}${CODE_BLOCK}`
        );
    }

    // https://developers.google.com/apps-script/reference/content/content-service#methods
    return ContentService.createTextOutput();
}

/** FAQデータを追加 */
function addFaq(q_text, a_text, keywords, trigger_id){
  const data = [q_text, a_text, keywords, trigger_id, new Date()];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAQ_SHEET);
  const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, data.length);
  dataRange.setValues([data]);
}

/** 検索用FAQデータを更新 */
function analyzeFaq(keywords, trigger_id){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);

  const keywordArray = keywords.split(',');
  for(keyword of keywordArray){
    const addData = [keyword, trigger_id];
    const addRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, addData.length);
    addRange.setValues([addData]);
  }
}
/** 
 * 検索用FAQデータを更新(すべて) 
 * faqシート(コマンドや手で追加・更新がありうる) -> contentシート(スクリプトで上書き更新する)
 */
function analyzeFaqAll(){
  const contentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  contentSheet.getRange(2, 1, contentSheet.getLastRow(), 10).clear(); // 10は適当

  const faqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAQ_SHEET);
  // varidation
  const keys = faqSheet.getRange(2, FAQ_COLUMN_ID, faqSheet.getLastRow()-1, 1).getValues().map(item => item[0]);
  const keySet = new Set(keys);
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

/** 質問履歴を登録 */
function addHistory(q_text, trigger_id){
  const data = [q_text, trigger_id, new Date()];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HISTORY_SHEET);
  const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, data.length);
  dataRange.setValues([data]);
}

/** 質問文に適したFAQを見つける */
function searchFaq(q_text){
  // 質問文からキーワードを抽出(簡易形態素解析)
  // https://takuya-1st.hatenablog.jp/entry/2016/04/02/145017
  const r=/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9\-]+|[ａ-ｚＡ-Ｚ０-９]+/g;
  const keywordArray = q_text.match(r);

  // キーワードからFAQを探す
  const contentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  const fullDatas = contentSheet.getDataRange().getValues();
  const results = [];
  for(keyword of keywordArray){
    const datas = fullDatas.filter(data => data[0] == keyword);
    Array.prototype.push.apply(results, datas);
  }
  if(results.length == 0){
    return ['not found'];
  }

  // もっともヒットしているFAQを特定
  const grouped = results.reduce((pre, cur) => {
    const id = cur[1];
    if (!pre.has(id)) pre.set(id, 0);
    pre.set(id, pre.get(id) + 1);
    return pre;
  }, new Map());
  const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
  const trigger_id = sorted[0][0];

  // trigger_idからFAQを取得
  const faqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAQ_SHEET);
  const searchRange = faqSheet.getRange(2, FAQ_COLUMN_ID, faqSheet.getLastRow());
  const finder = searchRange.createTextFinder(trigger_id);
  const first = finder.findNext();
  if(!first) {
    return [`not found(${trigger_id})`];
  }
  const index = first.getRowIndex();
  const answerData = faqSheet.getRange(index, 1, 1, FAQ_COLUMN_ID).getValues()[0];
  return ['NOP'].concat(answerData);
}

/** Slackへの応答 */
function ack(response_url, text){
  const options = {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: `{"text": "${text}"}`
  };
  try{
    const response = UrlFetchApp.fetch(response_url, options);
    console.log(response.toString());
  } catch(e){
    console.log(e);
  }
}
