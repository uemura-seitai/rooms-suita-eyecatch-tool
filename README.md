# ROOMs吹田 アイキャッチ作成

## 起動

```bash
npm install
npm run dev
```

## 通常利用（GitHub Pages）

普段は `https://uemura-seitai.github.io/rooms-suita-eyecatch-tool/` を開きます。Macが起動していなくても、画像作成、スマホのカメラロール保存、ファイル保存、WordPress投稿を利用できます。共有ライブラリだけはMac共有版専用の任意機能です。

## 同じWi-Fiで共有ライブラリを使う

普段使う入口は常に次の一つです。ローカル版URLやIPアドレスを開く必要はありません。

`https://uemura-seitai.github.io/rooms-suita-eyecatch-tool/`

共有APIは、このMacのBonjour名を使う次のLAN内HTTPS URLです。

`https://uemuranaoyanoMacBook-Pro.local:8787`

Wi-FiのIPアドレスが変わってもURLは変わりません。画像本体とメタデータは引き続きMac内の `shared-library-data/` にだけ保存されます。

### 初回のみ：MacのHTTPS証明書を準備する

Macで次を一度だけ実行します。ローカルCAとサーバー証明書は `.local-certs/` に生成され、Git管理されません。秘密鍵は外部へ送信されません。

```bash
cd /Users/uemuranaoya/rooms-suita-eyecatch-tool
chmod +x scripts/ensure-local-https.sh scripts/setup-local-https.sh scripts/start-local-share.sh scripts/install-launch-agent.sh
npm run setup-local-https
```

`setup-local-https` はMacのログインキーチェーンにこのローカルCAを信頼済みとして追加します。管理者確認が表示された場合は許可してください。

### 初回のみ：iPhone/iPadでローカルCAを信頼する

1. Macの `.local-certs/rooms-local-ca-cert.cer` をAirDrop、メール添付などでiPhone/iPadへ送ります（公開鍵のみです）。
2. iPhone/iPadでファイルを開き、表示されるプロファイルをダウンロードします。
3. **設定** → **一般** → **VPNとデバイス管理**（または「プロファイルがダウンロード済み」）からプロファイルをインストールします。
4. **設定** → **一般** → **情報** → **証明書信頼設定** を開き、「ROOMs Shared Library Local CA」をオンにして信頼します。

同じWi-Fi上で、GitHub Pagesの画面に「共有ライブラリ：利用可能」と表示されれば設定完了です。MacがOFFまたは別ネットワークの場合は「Mac起動時のみ利用できます」と表示され、通常機能はそのまま使えます。

公式LINEは共有ライブラリに依存しません。MacがOFFでも「画像をアップロード」から投稿枠1〜3を作成して1040×1850px PNGを出力できます。MacがONの時だけ「ライブラリから画像を選択」→「共有ライブラリ」が追加で利用できます。

### Macログイン時に自動起動する

このMacではNode/npmの実体パスが `/usr/local/bin/node`、`/usr/local/bin/npm` です。LaunchAgent用の起動スクリプトはこの絶対パスを使うため、ログイン時にもnvm等のシェル設定に依存しません。

初回または設定変更後に、Macで次を一度だけ実行します。

```bash
cd /Users/uemuranaoya/rooms-suita-eyecatch-tool
chmod +x scripts/start-local-share.sh scripts/install-launch-agent.sh
./scripts/install-launch-agent.sh
```

これにより `com.rooms.suita-eyecatch-local-share` が `~/Library/LaunchAgents/` に登録され、次回以降のログイン時に `npm run local-share` と同じHTTPS共有APIが起動します。GitHub Pagesを使うため、Viteのローカル公開は不要です。起動済みなら手動の `npm run local-share` は安全に終了し、別アプリが8787を使用中の場合は停止させずエラーにします。手動起動が先に動いていた場合も、LaunchAgentは手動プロセス終了後に自動で再試行します。

停止、再開、状態・ログの確認:

```bash
# 自動起動を停止
launchctl bootout gui/$(id -u)/com.rooms.suita-eyecatch-local-share

# 再開（設定ファイルは作り直し不要）
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.rooms.suita-eyecatch-local-share.plist
launchctl kickstart -k gui/$(id -u)/com.rooms.suita-eyecatch-local-share

# LaunchAgent・ポート・HTTPS応答を確認
launchctl print gui/$(id -u)/com.rooms.suita-eyecatch-local-share
lsof -nP -iTCP:8787 -sTCP:LISTEN
curl --cacert .local-certs/rooms-local-ca-cert.pem https://uemuranaoyanoMacBook-Pro.local:8787/api/health

# ログを確認
tail -f ~/Library/Logs/rooms-local-share.log
tail -f ~/Library/Logs/rooms-local-share-error.log
```

LaunchAgentは `.local-certs/` が未作成の場合も証明書を生成してからAPIを起動します。ただしiPhone/iPadのCA信頼は上記の初回設定が必要です。

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
