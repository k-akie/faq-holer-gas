import { commandParamSplit } from "./slack";
import { CONTENT_SHEET, FAQ_COLUMN_ANSWER, FAQ_COLUMN_ID, FAQ_COLUMN_QUESTION, FAQ_SHEET, HISTORY_SHEET } from "./spreadSheet";
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

const CODE_BLOCK = "```";

/** 入り口(GAS Webアプリとしての入り口) */
function doPost(e: any) {
    const response_url = e.parameter.response_url;
    const text = e.parameter.text.toString();
    ack(response_url); // いったんSlackに応答を返す

    // https://api.slack.com/interactivity/slash-commands
    if(e.parameter.command === '/faq-add') {
      // FIXME ダブルクォーテーションは1単語扱いする
      const input = commandParamSplit(text);
      if(input.length != 3){
        return ContentService.createTextOutput(
          "`/faq-add [質問文] [回答文] [キーワード(カンマ区切り)]`の形で入力してください\n\n"+
          `/faq-add ${text}`
          );
      }
      const q_text = input[0];
      const a_text = input[1];
      const keywords = input[2];

      const trigger_id = e.parameter.trigger_id.toString();
      addFaq(q_text, a_text, keywords, trigger_id);
      analyzeFaq(keywords, trigger_id);
      ack(response_url, `FAQを登録しました :writing_hand:${CODE_BLOCK}\nQ. ${q_text}\nA. ${a_text}\n(${keywords})${CODE_BLOCK}`);
    }

    if(e.parameter.command === '/faq') {
      const answerData = searchFaq(text);
      if(answerData.length < FAQ_COLUMN_ID){
        addHistory(text, 'not found');
        ack(response_url,
          `「${text}」という質問に近いFAQをが見つかりませんでした :bow:`+
          '\nキーワードを変えたら見つかるかもしれません'+
          '\n送り仮名をなくしたり、熟語に言い換えたりしてみてください'
          );
          return ContentService.createTextOutput();
      }
      addHistory(text, answerData[FAQ_COLUMN_ID]);
      ack(response_url,
        `「${text}」という質問に近いFAQを紹介します :point_up:`+
        `\n${CODE_BLOCK}Q. ${answerData[FAQ_COLUMN_QUESTION]}`+
        `\nA. ${answerData[FAQ_COLUMN_ANSWER]}${CODE_BLOCK}`
        );
    }

    // https://developers.google.com/apps-script/reference/content/content-service#methods
    return ContentService.createTextOutput();
}

/** FAQデータを追加 */
function addFaq(q_text: string, a_text: string, keywords: string, trigger_id: string){
  const data = [q_text, a_text, keywords, trigger_id, new Date()];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAQ_SHEET);
  if(sheet == null) return; // FIXME エラーハンドリングする
  const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, data.length);
  dataRange.setValues([data]);
}

/** 検索用FAQデータを更新 */
export function analyzeFaq(keywords: string, trigger_id: string){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if(sheet == null) return; // FIXME エラーハンドリングする

  const keywordArray = keywords.split(',');
  for(const keyword of keywordArray){
    const addData = [keyword, trigger_id];
    const addRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, addData.length);
    addRange.setValues([addData]);
  }
}

/** 質問履歴を登録 */
function addHistory(q_text: string, trigger_id: string){
  const data = [q_text, trigger_id, new Date()];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HISTORY_SHEET);
  if(sheet == null) return; // FIXME エラーハンドリングする
  const dataRange = sheet.getRange(sheet.getLastRow() + 1, 1, 1, data.length);
  dataRange.setValues([data]);
}

/** 質問文に適したFAQを見つける */
function searchFaq(q_text: string): string[] {
  // 質問文からキーワードを抽出(簡易形態素解析)
  // https://takuya-1st.hatenablog.jp/entry/2016/04/02/145017
  const r=/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9\-]+|[ａ-ｚＡ-Ｚ０-９]+/g;
  const keywordArray = q_text.match(r);
  if (keywordArray == null) return []; // FIXME エラーハンドリングする

  // キーワードからFAQを探す
  const contentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if(contentSheet == null) return []; // FIXME エラーハンドリングする
  const fullDatas = contentSheet.getDataRange().getValues();
  const results: string[] = [];
  for(const keyword of keywordArray){
    const datas = fullDatas.filter(data => data[0] == keyword);
    Array.prototype.push.apply(results, datas);
  }
  if(results.length == 0){
    return ['not found'];
  }

  // もっともヒットしているFAQ_IDを特定
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
  if(faqSheet == null) return []; // FIXME エラーハンドリングする
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
function ack(response_url: string, text = ''){
  const params: URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: `{"text": "${text}", "response_type": "in_channel"}`
  };
  try{
    UrlFetchApp.fetch(response_url, params);
  } catch(e){
    console.log(e);
  }
}
