# faq-holer-gas
faq-holerのGASで稼働する簡易処理版です。

## アーキテクチャ
- Google SpreadSheet
- Google App Script

## 設定手順
### 1. スプレッドシート、GASの設定
1. https://docs.google.com/spreadsheets/ から「新しいスプレッドシート」を作成する 
   - ファイル名はお好みで
2. メニュー「拡張機能」＞「Apps Script」を開く
   - プロジェクト名はお好みで 
   - 歯車マーク「プロジェクトの設定」を開き`「appsscript.json」マニフェスト ファイルをエディタで表示する`にチェックを入れる 
   - エディタに戻って ./src 以下の3ファイルを反映する
3. スプレッドシートに戻ってリロードし、メニュー「FAQ-BOT」が増えたことを確認
   -  「初期化(シート作成)」をする
4. 「デプロイ」>「デプロイを管理」から「デプロイメントを作成」しデプロイする
   - 説明はお好みで
   - 次のユーザーとして実行: `自分`
   - アクセスできるユーザー: `全員`
5. データへのアクセスを許可する必要がるので「アクセスを承認」する
   1. 「このアプリは Google で確認されていません」とポップアップが出ますが「詳細」を開いて`無題のプロジェクト（安全ではないページ）に移動`してください
   2. 「無題のプロジェクト が Google アカウントへのアクセスをリクエストしています」を「許可」してください
6. ウェブアプリのURLが表示されるのでコピーし ./manifest.yml の`url:`(2か所)に貼り付ける

### 2. Slackアプリの設定
1. https://api.slack.com/apps/ から「Create New Apps」する
2. 「From an app manifest」を選択し、ダイアログに従って選択を進める
3. ./manifest.yml の中身をコピーして貼り付け、作成を完了する
4. 必要に応じてアイコンなどを設定する
5. Workspaceにインストールする
   - 権限をリクエストされるので「許可」する

### 3. Slackで試してみる
「Faq-holer-gas」というAppが追加されているはずなのでDMからスラッシュコマンドを実行してみます
```slack
# FAQの登録
/faq-add 質問文 回答文 キーワード,keyword

# FAQを探す
/faq キーワード
```

## メモ
### ローカルからのGASファイル更新
https://github.com/google/clasp を設定することでローカルから反映・デプロイができます
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

※Develop Apps Script using TypeScript  |  Google Developers
https://developers.google.com/apps-script/guides/typescript
