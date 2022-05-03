import {SearchFaq} from '../src/SearchFaq';


describe('_textAnalyze', () => {
  test('分割されないとき', () => {
    expect(SearchFaq._textAnalyze('')).toStrictEqual([]);
    expect(SearchFaq._textAnalyze(',')).toStrictEqual([]);
    expect(SearchFaq._textAnalyze('あいう')).toStrictEqual(['あいう']);
  });
  test('分割されるとき', () => {
    expect(SearchFaq._textAnalyze('足し算')).toStrictEqual(['足', 'し', '算']);
    expect(SearchFaq._textAnalyze('こどもの日')).toStrictEqual(['こどもの', '日']);
    expect(SearchFaq._textAnalyze('システム開発')).toStrictEqual(['システム', '開発']);
    expect(SearchFaq._textAnalyze('KPTについて')).toStrictEqual(['KPT', 'について']);
  });
});

describe('textAnalyze: 助詞を含んで抽出', () => {
  test.each([
    ['吾輩は猫である。', ['吾輩', 'は', '猫', 'で', 'ある']],
    ['名前はまだ無い。', ['名前', 'は', 'まだ', '無い']],
    ['最寄り駅はどこですか', ['最寄り', '駅', 'は', 'どこですか']],
    ['どんなスキルが必要なのか', ['どんな', 'スキル', 'が', '必要', 'なのか']],
    ['今日は晴れなので洗濯を干した', ['今日', 'は', '晴', 'れな', 'ので', '洗濯', 'を', '干', 'した']],
    ['このリンゴが赤いのは熟してるからです', ['この', 'リンゴ', 'が', '赤', 'いの', 'は', '熟', 'してるからです']],
  ])('うまく解析できるとき(%s)', (input, expected) => {
    expect(SearchFaq.textAnalyze(input, false)).toStrictEqual(expected);
  });
  test.each([
    ['タバコは吸えますか', ['タバコ', 'は', '吸', 'えますか']],
    ['持ち帰りはできますか', ['持ち', '帰', 'りはできますか']],
  ])('かなが続くとき(%s)', (input, expected) => {
    expect(SearchFaq.textAnalyze(input, false)).toStrictEqual(expected);
  });
});

describe('textAnalyze: 助詞を除いて抽出', () => {
  test.each([
    ['吾輩は猫である。', ['吾輩', '猫', 'ある']],
    ['名前はまだ無い。', ['名前', 'まだ', '無い']],
    ['最寄り駅はどこですか', ['最寄り', '駅', 'どこですか']],
    ['どんなスキルが必要なのか', ['どんな', 'スキル', '必要', 'なのか']],
  ])('うまく解析できるとき(%s)', (input, expected) => {
    expect(SearchFaq.textAnalyze(input, true)).toStrictEqual(expected);
  });
  test.each([
    ['タバコは吸えますか', ['タバコ', '吸', 'えますか']],
    ['持ち帰りはできますか', ['持ち', '帰', 'りはできますか']],
  ])('かなが続くとき(%s)', (input, expected) => {
    expect(SearchFaq.textAnalyze(input, true)).toStrictEqual(expected);
  });
  test('デフォルト値', () => {
    expect(SearchFaq.textAnalyze('地球は丸い')).toStrictEqual(['地球', '丸い']);
  });
});

describe('serachByKeyword', () => {
  const targetData: string[][] = [
    // keyword, ID
    ['A', '1'],
    ['B', '2'],
    ['C', '3'],
  ];
  test('見つかるとき', () => {
    expect(SearchFaq.serachByKeyword(['A'], targetData)).toStrictEqual([['A', '1']]);
    expect(SearchFaq.serachByKeyword(['A', 'B'], targetData)).toStrictEqual([['A', '1'], ['B', '2']]);
  });
  test('見つからないとき', () => {
    expect(SearchFaq.serachByKeyword([], targetData)).toStrictEqual([]);
    expect(SearchFaq.serachByKeyword(['D'], targetData)).toStrictEqual([]);
  });
});

describe('mostHits', () => {
  test('データなし', () => {
    expect(SearchFaq.mostHits([])).toStrictEqual('');
  });
  test('IDかぶりなし', () => {
    expect(SearchFaq.mostHits([['A', '1']])).toStrictEqual('1');
    expect(SearchFaq.mostHits([['A', '1'], ['B', '2']])).toStrictEqual('1');
    expect(SearchFaq.mostHits([['B', '2'], ['A', '1']])).toStrictEqual('2');
  });
  test('IDかぶりあり', () => {
    expect(SearchFaq.mostHits([['A', '1'], ['a', '1'], ['B', '2']])).toStrictEqual('1');
    expect(SearchFaq.mostHits([['A', '1'], ['B', '2'], ['b', '2']])).toStrictEqual('2');
  });
});
