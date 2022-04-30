import { SearchFaq } from "../src/SearchFaq";


describe("textAnalyze", () => {
    test("分割されないとき", () => {
        expect(SearchFaq.textAnalyze('')).toStrictEqual([]);
        expect(SearchFaq.textAnalyze(',')).toStrictEqual([]);
        expect(SearchFaq.textAnalyze('あいう')).toStrictEqual(['あいう']);
    });
    test("分割されるとき", () => {
        expect(SearchFaq.textAnalyze('足し算')).toStrictEqual(['足', 'し', '算']);
        expect(SearchFaq.textAnalyze('こどもの日')).toStrictEqual(['こどもの', '日']);
        expect(SearchFaq.textAnalyze('システム開発')).toStrictEqual(['システム', '開発']);
        expect(SearchFaq.textAnalyze('KPTについて')).toStrictEqual(['KPT', 'について']);
    });
});

describe("serachByKeyword", () => {
    const targetData: string[][] = [
        // keyword, ID
        ['A', '1'],
        ['B', '2'],
        ['C', '3'],
    ];
    test("見つかるとき", () => {
        expect(SearchFaq.serachByKeyword(['A'], targetData)).toStrictEqual([['A', '1'],]);
        expect(SearchFaq.serachByKeyword(['A', 'B'], targetData)).toStrictEqual([['A', '1'],['B', '2'],]);
    });
    test("見つからないとき", () => {
        expect(SearchFaq.serachByKeyword([], targetData)).toStrictEqual([]);
        expect(SearchFaq.serachByKeyword(['D'], targetData)).toStrictEqual([]);
    });
});

describe("mostHits", () => {
    test("データなし", () => {
        expect(SearchFaq.mostHits([])).toStrictEqual('');
    });
    test("IDかぶりなし", () => {
        expect(SearchFaq.mostHits([['A', '1']])).toStrictEqual('1');
        expect(SearchFaq.mostHits([['A', '1'],['B', '2'],])).toStrictEqual('1');
        expect(SearchFaq.mostHits([['B', '2'],['A', '1'],])).toStrictEqual('2');
    });
    test("IDかぶりあり", () => {
        expect(SearchFaq.mostHits([['A', '1'],['a', '1'],['B', '2'],])).toStrictEqual('1');
        expect(SearchFaq.mostHits([['A', '1'],['B', '2'],['b', '2']])).toStrictEqual('2');
    });
});
