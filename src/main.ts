import { Slack } from "./Slack";
import { FaqColumn, Sheets, Spread } from "./spreadSheet";
import { SearchFaq } from "./SearchFaq";
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

const CODE_BLOCK = "```";

interface PostEvent {
  queryString: string;
  parameter: { [index: string]: string; };
  parameters: { [index: string]: [string]; };
  contentLenth: number;
  postData: {
    length: number;
    type: string;
    contents: string;
    name: string;
  };
}

/** 入り口(GAS Webアプリとしての入り口) */
function doPost(e: PostEvent): GoogleAppsScript.Content.TextOutput {
    const response_url = e.parameter.response_url;
    const text = e.parameter.text.toString();
    ack(response_url); // いったんSlackに応答を返す

    // https://api.slack.com/interactivity/slash-commands
    if(e.parameter.command === '/faq-add') {
      // FIXME ダブルクォーテーションは1単語扱いする
      const input = Slack.commandParamSplit(text);
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
      Analyze.faq(keywords, trigger_id);
      ack(response_url, `FAQを登録しました :writing_hand:${CODE_BLOCK}\nQ. ${q_text}\nA. ${a_text}\n(${keywords})${CODE_BLOCK}`);
    }

    if(e.parameter.command === '/faq') {
      const answerData = searchFaq(text);
      if(answerData.length < FaqColumn.ID){
        addHistory(text, 'not found');
        ack(response_url,
          `「${text}」という質問に近いFAQをが見つかりませんでした :bow:`+
          '\nキーワードを変えたら見つかるかもしれません'+
          '\n送り仮名をなくしたり、熟語に言い換えたりしてみてください'
          );
          return ContentService.createTextOutput();
      }
      addHistory(text, answerData[FaqColumn.ID]);
      ack(response_url,
        `「${text}」という質問に近いFAQを紹介します :point_up:`+
        `\n${CODE_BLOCK}Q. ${answerData[FaqColumn.QUESTION]}`+
        `\nA. ${answerData[FaqColumn.ANSWER]}${CODE_BLOCK}`
        );
    }

    // https://developers.google.com/apps-script/reference/content/content-service#methods
    return ContentService.createTextOutput();
}

/** FAQデータを追加 */
function addFaq(q_text: string, a_text: string, keywords: string, trigger_id: string){
  const data = [q_text, a_text, keywords, trigger_id, new Date()];
  Spread.insertLineData(Sheets.FAQ, data);
}

/** 検索用FAQデータを更新 */
export class Analyze {
  static faq(keywords: string, trigger_id: string){
    const keywordArray = keywords.split(',');
    const addData = keywordArray.map(keyword => [keyword, trigger_id]);
    Spread.insertData(Sheets.CONTENT, addData);
  }
}

/** 質問履歴を登録 */
function addHistory(q_text: string, trigger_id: string){
  const data = [q_text, trigger_id, new Date()];
  Spread.insertLineData(Sheets.HISTORY, data);
}

/** 質問文に適したFAQを見つける */
function searchFaq(q_text: string): string[] {
  // キーワードからFAQを探す
  const keywordArray = SearchFaq.textAnalyze(q_text);
  const fullDatas = Spread.selectAllData(Sheets.CONTENT);
  const results = SearchFaq.serachByKeyword(keywordArray, fullDatas);
  if(results.length == 0){
    return ['not found'];
  }

  // もっともヒットしているFAQ_IDを特定
  const trigger_id = SearchFaq.mostHits(results);

  // trigger_idからFAQを取得  
  const faqData = Spread.selectAllData(Sheets.FAQ);
  const filterdFaq = faqData.filter(value => value[FaqColumn.ID - 1] == trigger_id);
  if(filterdFaq.length == 0) {
    return [`not found(${trigger_id})`];
  }
  return ['NOP'].concat(filterdFaq[0]);
}

/** Slackへの応答 */
function ack(response_url: string, text = ''){
  const params: URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: `{"text": "${text}", "response_type": "in_channel"}`
  };
  UrlFetchApp.fetch(response_url, params);
}
