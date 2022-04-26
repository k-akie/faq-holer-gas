import { commandParamSplit } from "../src/slack";


describe('commandParamSplit', () => {
    test('スペースだけで区切られているとき', () => {
        expect(commandParamSplit('a b c')).toStrictEqual(['a', 'b', 'c']);
    });
    test('空のとき', () => {
        expect(commandParamSplit('')).toStrictEqual([]);
    });
    test('ダブルクォーテーションでくくっているとき', () => {
        expect(commandParamSplit('"a あい" "b 123" "c d"')).toStrictEqual(['a あい', 'b 123', 'c d']);
        expect(commandParamSplit('a "b 123" "c d"')).toStrictEqual(['a', 'b 123', 'c d']);
        expect(commandParamSplit('"a b" 123 c')).toStrictEqual(['a b', '123', 'c']);
        expect(commandParamSplit('"a b c"')).toStrictEqual(['a b c']);
    });
    test('ダブルクォーテーションのペアがおかしいとき', () => {
        expect(commandParamSplit('"a b')).toStrictEqual(['a b']);
        expect(commandParamSplit('a b"')).toStrictEqual(['a', 'b']);
        expect(commandParamSplit('a b" c')).toStrictEqual(['a', 'b c']);
    });
});