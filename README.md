# cline-support

大規模プロジェクトをClineで開発するためのシステムです。

プロジェクト知識を提供するMCPサーバーと、`.clinerule`やコーディング原則等を示したファイルから構成されています。

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

## 開発情報

### スクリプト

- `npm run build` - TypeScriptのコンパイル
- `npm run start` - サーバーの直接実行（デバッグ用）
- `npm run dev` - ビルドしてから実行

### データ形式

データファイル（`data/design.json`）の詳細な形式については、`data/design.json.template`を参照してください。
