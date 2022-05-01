// main#searchFaq の処理を分割したもの

export class SearchFaq {
  /** 簡易形態素解析 */
  static _textAnalyze(text: string): string[] {
    // https://takuya-1st.hatenablog.jp/entry/2016/04/02/145017
    const r = /[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9\-]+|[ａ-ｚＡ-Ｚ０-９]+/g;
    const keywordArray = text.match(r);
    if (keywordArray == null) return []; // FIXME エラーハンドリングする
    return keywordArray;
  }

  /** 簡易形態素解析(助詞考慮) */
  static textAnalyze(text: string, onlyNoun: boolean = true): string[] {
    const keywordArray = this._textAnalyze(text);
    // https://qiita.com/kinoshita_yuri/items/e15f143981f1616994ed
    const result: string[] = [];
    let kanji = false;
    for (const keyword of keywordArray) {
      if (keyword.match(/[ぁ-んー]/g)) {
        // 先頭にあったら助詞とみなす
        const particlePre = /^[はがのにへともでを]/g;
        const mathcedPre = keyword.match(particlePre);
        if (mathcedPre) {
          if (!onlyNoun) {
            result.push(mathcedPre[0]);
          }
          if (keyword.length > 1) {
            result.push(keyword.replace(particlePre, ''));
          }
          kanji = false;
          continue;
        }

        // 末尾にあったら助詞とみなす
        const particleSuf = /(.+)(ので)|(から)|(まで)|[もはがでを]$/g;
        const matchedSuf = keyword.match(particleSuf);
        if (matchedSuf) {
          result.push(keyword.replace(particleSuf, ''));
          if (!onlyNoun) {
            result.push(matchedSuf[0]);
          }
          kanji = false;
          continue;
        }
      }

      // 助詞じゃないのに漢字のあとにひらがな1文字があるときは、送り仮名とみなす
      if (kanji && keyword.length == 1) {
        const preItem = result[result.length - 1];
        result[result.length - 1] = preItem + keyword;
        kanji = false;
        continue;
      }

      kanji = false;
      if (keyword.match(/[一-龠]+/g)) {
        kanji = true;
      }

      result.push(keyword);
    }

    return result;
  }

  /** キーワード配列に合致するデータを探す */
  static serachByKeyword(
      keywordArray: string[],
      targetData: string[][],
  ): string[][] {
    const results: string[][] = [];
    for (const keyword of keywordArray) {
      const datas = targetData.filter((data) => data[0] == keyword);
      Array.prototype.push.apply(results, datas);
    }
    return results;
  }

  /** 最頻出の値を探す */
  static mostHits(target: string[][]): string {
    if (target.length == 0) {
      return '';
    }

    const grouped = target.reduce((pre, cur) => {
      const id = cur[1];
      if (!pre.has(id)) pre.set(id, 0);
      pre.set(id, Number(pre.get(id)) + 1);
      return pre;
    }, new Map<string, number>());
    const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }
}
