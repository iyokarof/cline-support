# cline-support

大規模プロジェクトをClineで開発するためのシステムです。

プロジェクト知識を提供するMCPサーバーと、REST APIサーバー、`.clinerules`やコーディング原則等を示したファイルから構成されています。

## 機能

### MCPサーバーモード（デフォルト）
- Cline拡張機能と連携してプロジェクト知識を提供
- 機能定義とユビキタス言語情報の管理

### REST APIサーバーモード
- デバッグや外部ツールとの連携用のREST APIを提供
- MCPサーバーと同等の機能をHTTP経由で利用可能

## 環境構築手順

### 1. 前提条件

- Node.js (v18以降推奨) がインストールされていること
- VSCode拡張機能のClineがインストールされていること

### 2. プロジェクトのセットアップ

1. 導入したいプロジェクトに`clineSupport`ディレクトリを作成し、本プロジェクトの内容をコピーします。
2. `files`以下のファイルをコピーして、プロジェクトのルートディレクトリに配置します。

### 3. 依存関係のインストール・ビルド

`clineSupport`ディレクトリに移動し以下コマンドを実行します。

```bash
npm install
npm run build
```

### 4. MCPサーバーの登録

Clineの設定ファイルにサーバー情報を追加します。

**設定方法:**
Cline拡張機能タブ > サーバーマーク > Configure MCP Servers

**設定内容:**
```json
{
  "mcpServers": {
    "cline-support": {
      "command": "node",
      "args": ["{ルートディレクトリの絶対パス}/clineSupport/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 5. Clineの再起動

VS Codeを再起動して、MCPサーバーの設定を反映させます。

## REST APIサーバーの使用方法

### 起動方法

```bash
# REST APIサーバーとして起動
npm run start:rest

# または開発用（ビルド + 起動）
npm run dev:rest
```

### アクセス情報

- **ベースURL**: http://localhost:3000
- **API ベースパス**: http://localhost:3000/api
- **ヘルスチェック**: http://localhost:3000/api/health

### 利用可能なエンドポイント

#### 機能定義関連
- `POST /api/features` - 機能定義の追加・更新
- `DELETE /api/features/:name` - 機能定義の削除
- `GET /api/resources/features` - 機能定義一覧の取得

#### ユビキタス言語関連
- `POST /api/terms` - ユビキタス言語の追加・更新
- `DELETE /api/terms/:name` - ユビキタス言語の削除
- `GET /api/resources/terms` - ユビキタス言語一覧の取得

#### その他
- `POST /api/details` - 詳細情報の取得
- `GET /api/resources/statistics` - 統計情報の取得
- `GET /api/health` - ヘルスチェック

## 開発情報

### スクリプト

#### 共通
- `npm run build` - TypeScriptのコンパイル

#### MCPサーバー
- `npm run start` - MCPサーバーとして起動
- `npm run dev` - ビルド + MCPサーバー起動

#### REST APIサーバー
- `npm run start:rest` - REST APIサーバーとして起動
- `npm run dev:rest` - ビルド + REST APIサーバー起動

### 環境変数

- `SERVER_MODE` - サーバーモード（`mcp` または `rest`、デフォルト: `mcp`）
- `PORT` - REST APIサーバーのポート番号（デフォルト: 3000）
- `HOST` - REST APIサーバーのホスト（デフォルト: localhost）

### データ形式

データファイル（`data/design.json`）の詳細な形式については、`data/design.json.template`を参照してください。
