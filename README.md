# ROOMs吹田 アイキャッチ作成

## 起動

```bash
npm install
npm run dev
```

## 同じWi-Fiで共有ライブラリを使う

Macを親機にして、iPhone/iPad/PCで同じ画像ライブラリを使うときは、Macで次を実行します。

```bash
npm run local-share
```

Viteアプリ（ポート5173）と共有ライブラリAPI（ポート8787）が同時に起動します。ターミナルに表示される `Network` URL をスマホで開いてください。通常は以下のようになります（`192.168.1.20` はMacの実際のIPアドレスに置き換わります）。

- Mac: `http://localhost:5173/rooms-suita-eyecatch-tool/`
- スマホ・同じWi-Fi内のPC: `http://192.168.1.20:5173/rooms-suita-eyecatch-tool/`

ローカル起動URLから開いた場合、共有ライブラリURLは同じMacの `:8787` を自動で使います。GitHub Pagesなどから開く場合は、画面の「共有ライブラリ設定」に `http://192.168.1.20:8787` を入力してください。ただしHTTPSのGitHub PagesからHTTPのMac APIへはブラウザの混在コンテンツ制限で接続できないことがあるため、共有時は上記のローカル起動URLを使ってください。

完成画像では「この端末のライブラリに保存」と「共有ライブラリに保存」を選べます。公式LINEの「ライブラリから画像を選択」では「この端末」「共有ライブラリ」を切り替えられます。共有データはMacの `shared-library-data/images/`（画像本体）と `shared-library-data/library.json`（メタデータ）に保存され、Macでサーバーを止めても端末内ライブラリは引き続き使えます。

### Macログイン時に自動起動する

このMacではNode/npmの実体パスが `/usr/local/bin/node`、`/usr/local/bin/npm` です。LaunchAgent用の起動スクリプトはこの絶対パスを使うため、ログイン時にもnvm等のシェル設定に依存しません。

初回または設定変更後に、Macで次を一度だけ実行します。

```bash
cd /Users/uemuranaoya/rooms-suita-eyecatch-tool
chmod +x scripts/start-local-share.sh scripts/install-launch-agent.sh
./scripts/install-launch-agent.sh
```

これにより `com.rooms.suita-eyecatch-local-share` が `~/Library/LaunchAgents/` に登録され、次回以降のログイン時に `npm run local-share` と同じ共有API・Viteアプリが起動します。起動済みなら手動の `npm run local-share` は安全に終了し、別アプリが5173または8787を使用中の場合は停止させずエラーにします。手動起動が先に動いていた場合も、LaunchAgentは手動プロセス終了後に自動で再試行します。

停止、再開、状態・ログの確認:

```bash
# 自動起動を停止
launchctl bootout gui/$(id -u)/com.rooms.suita-eyecatch-local-share

# 再開（設定ファイルは作り直し不要）
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.rooms.suita-eyecatch-local-share.plist
launchctl kickstart -k gui/$(id -u)/com.rooms.suita-eyecatch-local-share

# LaunchAgent・ポート・HTTP応答を確認
launchctl print gui/$(id -u)/com.rooms.suita-eyecatch-local-share
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:8787 -sTCP:LISTEN
curl http://localhost:8787/api/images

# ログを確認
tail -f ~/Library/Logs/rooms-local-share.log
tail -f ~/Library/Logs/rooms-local-share-error.log
```

スマホ用の現在のURLは、起動ログにViteが出す `Network:` 行を確認してください。手早く確認する場合は、Wi-Fi接続中に `ipconfig getifaddr en0` を実行し、`http://表示されたIP:5173/rooms-suita-eyecatch-tool/` を開きます。共有APIは `http://表示されたIP:8787/api/images` です。IPは固定ではないため、コードには保存していません。

## テンプレート配置

正式ZIPから展開したPNGはすでに以下の場所へ配置済みです。テンプレートの絵柄はアプリ側で一切描き直しません。将来テンプレートを差し替える際は、対応表どおりにリネームして同じ場所へ配置してください。

| 元ZIP | 配置先 | 英数字ファイル名 |
| --- | --- | --- |
| お知らせ投稿テンプレート.zip | `public/templates/notice/` | `kokorone.png`, `takahashi.png`, `yamamoto.png`, `familie.png`, `grandir.png`, `chamyu.png`, `rest.png`, `knot.png`, `ecc.png`, `aiko.png`, `kstyle.png`, `chihiro.png`, `maki.png`, `uemura.png` |
| 健康情報.zip | `public/templates/health/` | `uemura.png`, `aiko.png`, `kstyle.png`, `maki.png`, `kokorone.png` |

割り当ての根拠は `src/config/templateConfig.ts` で一元管理しています。ZIP原本名との対応は制作指示書の対応表を守ってください。特に健康情報の `kokorone.png` は「2_Makiさんの食養講座のコピーのコピー.png」（実画像はこころね発酵ごはんROOM）です。

## スマホでの使い方

投稿タイプ、加盟店、タイトル、必要なら写真を選びます。健康情報のみ詳細設定でサブタイトル・ハッシュタグ・上部ラベルを追加できます。プレビュー確認後に「画像を作成」→「PNGを保存」、対応端末では「共有・写真へ保存」を押してください。

## 本番運用（スマホだけで利用）

公開後のURLをiPhone SafariまたはAndroid Chromeで開けば、Macや開発サーバーは不要です。画像はブラウザ内のCanvasだけで処理され、選択した写真はサーバーへ送信されません。公開サイトはHTTPSで運用してください。PWA（ホーム画面追加）とWeb Share APIはHTTPSで利用できます。

## GitHub Pagesへ公開

1. このプロジェクトを `rooms-suita-eyecatch-tool` という名前で GitHub に push します。
2. GitHub のリポジトリで **Settings** → **Pages** → **Build and deployment** → **Source** を **GitHub Actions** に設定します。
3. `main` ブランチへの push ごとに GitHub Actions が `npm ci` と `npm run build` を実行し、`dist` を自動公開します。
4. 公開URLは `https://＜GitHubユーザー名＞.github.io/rooms-suita-eyecatch-tool/` です。

初回の公開後は、上記のURLをスマホで開いて利用してください。Node.jsやバックエンドは不要です。

## iPhoneでホーム画面に追加

1. Safariで公開URLを開きます。
2. 画面下部の共有ボタン（□に↑）を押します。
3. 「ホーム画面に追加」を選び、「追加」を押します。
4. ホーム画面の「ROOMs吹田」アイコンから起動できます。

Android Chromeでは、メニューの「アプリをインストール」または「ホーム画面に追加」を選択してください。

## PWA対応

`manifest.webmanifest` とホーム画面アイコンを追加済みです。更新時の安定表示を優先するため、アプリ本体やテンプレートのオフラインキャッシュは使用していません。公開後に再読み込みすると常に最新版を取得します。
