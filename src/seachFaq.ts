// main#searchFaq の処理を分割したもの

/** 質問文からキーワードを抽出する */
export function textAnalyze(text: string): string[]{
  // 簡易形態素解析
  // https://takuya-1st.hatenablog.jp/entry/2016/04/02/145017
  const r=/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9\-]+|[ａ-ｚＡ-Ｚ０-９]+/g;
  const keywordArray = text.match(r);
  if (keywordArray == null) return []; // FIXME エラーハンドリングする
  return keywordArray;
}

/** キーワード配列に合致するデータを探す */
export function serachByKeyword(keywordArray: string[], target: string[][]): string[] {
    const results: string[] = [];
    for(const keyword of keywordArray){
      const datas = target.filter(data => data[0] == keyword);
      Array.prototype.push.apply(results, datas);
    }
    return results;
}

/** 最頻出の値を探す */
export function mostHits(target: string[]): string {
    const grouped = target.reduce((pre, cur) => {
        const id = cur[1];
        if (!pre.has(id)) pre.set(id, 0);
        pre.set(id, Number(pre.get(id)) + 1);
        return pre;
      }, new Map<string, number>());
      const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
      return sorted[0][0];
}