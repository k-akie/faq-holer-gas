export class Slack {
    static commandParamSplit(text: string): string[]{
        const result = [];
        let temp = '';
        let oneLine = false;
        for (const char of text){
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
        
        return result;
    }
}
