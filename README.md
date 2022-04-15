# faq-holer-gas
faq-holerのGASで稼働する簡易処理版です。

## アーキテクチャ
- Google SpreadSheet
- Google App Script

## デプロイ
clasp or GASのエディタからデプロイします
https://github.com/google/clasp
```bash
# GASに反映(.claspignore)
clasp push

# デプロイ
## デプロイIDを確認
clasp deployments
clasp deploy --deploymentId <id> --description <description>

# WEBエディターを開く
clasp open

# WEBエディターのデータを取得する
clasp pull
```

※claspについては以下を参考にしました
https://dev.classmethod.jp/articles/vscode-clasp-setting/
