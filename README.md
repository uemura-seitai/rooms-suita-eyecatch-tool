# ROOMs吹田 アイキャッチ作成

## 起動

```bash
npm install
npm run dev
```

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

`manifest.webmanifest`、ホーム画面アイコン、Service Workerを追加済みです。初回に公開URLを開くとアプリ本体と使用したテンプレートが端末のキャッシュに保存されるため、次回以降の表示も速くなります。アプリ更新時はブラウザを再読み込みしてください。
