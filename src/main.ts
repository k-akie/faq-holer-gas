import { Slack } from "./Slack";
import { FaqColumn, Sheets, Spread } from "./spreadSheet";
import { SearchFaq } from "./SearchFaq";
// eslint-disable-next-line camelcase
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
// eslint-disable-next-line no-unused-vars
function doPost(e: PostEvent): GoogleAppsScript.Content.TextOutput {
    const responseUrl = e.parameter.response_url;
    const text = e.parameter.text;
    const command = e.parameter.command;
    ack(responseUrl); // いったんSlackに応答を返す

    // https://api.slack.com/interactivity/slash-commands
    if(command === '/faq-add') {
      const params = Slack.commandParamSplit(text);
      if(params.length != 3){
        return ContentService.createTextOutput(
          "`/faq-add [質問文] [回答文] [キーワード(カンマ区切り)]`の形で入力してください\n\n"+
          `/faq-add ${text}`
          );
      }

      const question = params[0];
      const answer = params[1];
      const keywords = params[2];

      const triggerId = e.parameter.trigger_id.toString();
      addFaq(question, answer, keywords, triggerId);
      Analyze.faq(keywords, triggerId);
      ack(responseUrl, `FAQを登録しました :writing_hand:${CODE_BLOCK}\nQ. ${question}\nA. ${answer}\n(${keywords})${CODE_BLOCK}`);
    }

    if(command === '/faq') {
      const answerData = searchFaq(text);
      if(answerData.length < FaqColumn.ID){
        addHistory(text, 'not found');
        ack(responseUrl,
          `「${text}」という質問に近いFAQをが見つかりませんでした :bow:`+
          '\nキーワードを変えたら見つかるかもしれません'+
          '\n送り仮名をなくしたり、熟語に言い換えたりしてみてください'
          );
          return ContentService.createTextOutput();
      }

      addHistory(text, answerData[FaqColumn.ID]);
      ack(responseUrl,
        `「${text}」という質問に近いFAQを紹介します :point_up:`+
        `\n${CODE_BLOCK}Q. ${answerData[FaqColumn.QUESTION]}`+
        `\nA. ${answerData[FaqColumn.ANSWER]}${CODE_BLOCK}`
        );
    }

    // https://developers.google.com/apps-script/reference/content/content-service#methods
    return ContentService.createTextOutput();
}

/** FAQデータを追加 */
function addFaq(question: string, answer: string, keywords: string, triggerId: string){
  const data = [question, answer, keywords, triggerId, new Date()];
  Spread.insertLineData(Sheets.FAQ, data);
}

/** 検索用FAQデータを更新 */
export class Analyze {
  static faq(keywords: string, triggerId: string){
    const keywordArray = keywords.split(',');
    const addData = keywordArray.map(keyword => [keyword, triggerId]);
    Spread.insertData(Sheets.CONTENT, addData);
  }
}

/** 質問履歴を登録 */
function addHistory(question: string, triggerId: string){
  const data = [question, triggerId, new Date()];
  Spread.insertLineData(Sheets.HISTORY, data);
}

/** 質問文に適したFAQを見つける */
function searchFaq(question: string): string[] {
  // キーワードからFAQを探す
  const keywordArray = SearchFaq.textAnalyze(question);
  const fullDatas = Spread.selectAllData(Sheets.CONTENT);
  const results = SearchFaq.serachByKeyword(keywordArray, fullDatas);

  // もっともヒットしているFAQ_IDを特定
  const triggerId = SearchFaq.mostHits(results);
  if(triggerId.length == 0){
    return ['not found'];
  }

  // trigger_idからFAQを取得  
  const faqData = Spread.selectAllData(Sheets.FAQ);
  const filterdFaq = faqData.filter(value => value[FaqColumn.ID - 1] == triggerId);
  if(filterdFaq.length == 0) {
    return [`not found(${triggerId})`];
  }
  return ['NOP'].concat(filterdFaq[0]);
}

/** Slackへの応答 */
function ack(responseUrl: string, text = ''){
  const params: URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: `{"text": "${text}", "response_type": "in_channel"}`
  };
  UrlFetchApp.fetch(responseUrl, params);
}
