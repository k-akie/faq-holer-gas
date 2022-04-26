/**
 * Slackのスラッシュコマンドの引数を分割する
 * @param {string} text Slackのスラッシュコマンドの引数
 * @returns {string}
 */
export function spliter(text){
    console.log(text);
    var result = [];
    var temp = '';
    var oneLine = false;
    for (char of text){
        if(char == ' '){
            if(oneLine) {
                temp += char;
                continue;
            }
            if(temp.length > 0){
                result.push(temp);
                temp = '';
            }
            continue;
        }
        if(char == '"'){
            if(oneLine){
                oneLine = false;
                result.push(temp);
                temp = '';
                continue;
            } else {
                oneLine = true;
                continue;
            }
        }
        temp += char;
    }
    if(temp.length > 0){
        result.push(temp);
        temp = '';
    }
    
    console.log(result);
}