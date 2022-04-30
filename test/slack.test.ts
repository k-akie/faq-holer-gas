import { Slack } from "../src/slack";


describe('commandParamSplit', () => {
    test('スペースだけで区切られているとき', () => {
        expect(Slack.commandParamSplit('a b c')).toStrictEqual(['a', 'b', 'c']);
    });
    test('空のとき', () => {
        expect(Slack.commandParamSplit('')).toStrictEqual([]);
    });
    test('ダブルクォーテーションでくくっているとき', () => {
        expect(Slack.commandParamSplit('"a あい" "b 123" "c d"')).toStrictEqual(['a あい', 'b 123', 'c d']);
        expect(Slack.commandParamSplit('a "b 123" "c d"')).toStrictEqual(['a', 'b 123', 'c d']);
        expect(Slack.commandParamSplit('"a b" 123 c')).toStrictEqual(['a b', '123', 'c']);
        expect(Slack.commandParamSplit('"a b c"')).toStrictEqual(['a b c']);
    });
    test('ダブルクォーテーションのペアがおかしいとき', () => {
        expect(Slack.commandParamSplit('"a b')).toStrictEqual(['a b']);
        expect(Slack.commandParamSplit('a b"')).toStrictEqual(['a', 'b']);
        expect(Slack.commandParamSplit('a b" c')).toStrictEqual(['a', 'b c']);
    });
});