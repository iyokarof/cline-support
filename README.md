# cline-support
大規模プロジェクトをClineで開発するためのシステム

## Cline Support MCP Server

Clineをサポートするローカル MCP（Model Context Protocol）サーバーです。プロジェクトの機能定義とユビキタス言語情報を管理し、Clineからの要求に応じて情報を提供または更新します。

### 概要

このMCPサーバーは以下の機能を提供します：

- **機能定義管理**: プロジェクトの機能設計書の管理
- **ユビキタス言語管理**: ドメイン用語の辞書機能
- **データ永続化**: JSON形式でのローカルファイル保存
- **リアルタイム更新**: Clineからの指示による即座のデータ更新

### プロジェクト構成

```
clineSupport/localServer/
├── package.json              # プロジェクト設定
├── tsconfig.json             # TypeScript設定
├── README.md                 # このファイル
├── src/                      # ソースコード
│   ├── index.ts             # MCPサーバーメイン実装
│   ├── types.ts             # 型定義
│   ├── validators.ts        # バリデーション機能
│   ├── dataManager.ts       # データ管理クラス
│   ├── handlers/            # ハンドラー実装
│   │   ├── resourceHandlers.ts  # リソース処理
│   │   └── toolHandlers.ts      # ツール処理
│   └── schemas/             # スキーマ定義
│       └── toolSchemas.ts   # ツールのJSON Schema
├── build/                    # コンパイル済みJavaScript（生成）
│   ├── index.js
│   ├── types.js
│   ├── validators.js
│   ├── dataManager.js
│   ├── handlers/
│   │   ├── resourceHandlers.js
│   │   └── toolHandlers.js
│   └── schemas/
│       └── toolSchemas.js
├── data/                     # データファイル
│   └── design.json          # 機能定義・ユビキタス言語データ
└── template/                 # テンプレートファイル
    └── design.json          # データ構造のサンプル
```

### 環境構築手順

#### 1. 前提条件

- Node.js (v18以降推奨)
- TypeScript
- Cline（Claude Dev拡張機能）

#### 2. 依存関係のインストール

```bash
cd clineSupport/localServer
npm install
```

#### 3. プロジェクトのビルド

```bash
npm run build
```

#### 4. MCPサーバーの登録

Clineの設定ファイルにサーバー情報を追加します：

**設定方法:**
Cline拡張機能タブ > サーバーマーク > Configure MCP Servers

**設定内容:**
```json
{
  "mcpServers": {
    "cline-support": {
      "command": "node",
      "args": ["{ルートディレクトリの絶対パス}/clineSupport/localServer/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### 5. Clineの再起動

VS Codeを再起動して、MCPサーバーの設定を反映させます。

### 利用手順

#### 利用可能なリソース

MCPサーバーは以下のリソースを提供します：

1. **design://features/list** - 機能定義一覧（索引）
2. **design://terms/list** - ユビキタス言語一覧（索引）
3. **design://statistics** - 設計書統計情報

#### 利用可能なツール

#### 1. 機能定義の管理

**追加・更新:**
```
add_or_update_feature ツールを使用して機能定義を追加または更新
```

**削除:**
```
delete_feature ツールで指定した機能名の機能定義を削除
```

#### 2. ユビキタス言語の管理

**追加・更新:**
```
add_or_update_term ツールを使用してユビキタス言語情報を追加または更新
```

**削除:**
```
delete_term ツールで指定した用語の情報を削除
```

#### 3. 詳細情報の取得

**一括取得:**
```
get_details ツールで複数の機能定義と用語の詳細を一括取得
```

#### 実際の使用例

#### 1. 機能定義一覧の確認

Clineに以下のように指示します：
```
機能定義の一覧を確認してください
```

#### 2. 新しい機能定義の追加

```
「ユーザー認証」機能を追加してください
```

Clineは自動的に適切な形式で機能定義を生成し、MCPサーバーに送信します。

#### 3. ユビキタス言語の追加

```
「ユーザー」という用語をユビキタス言語に追加してください
```

Clineは自動的に適切な形式で用語定義を生成し、MCPサーバーに送信します。

### トラブルシューティング

#### よくある問題

1. **MCPサーバーが認識されない**
   - VS Codeを完全に再起動してください
   - 設定ファイルのパスが正しいか確認してください

2. **ビルドエラーが発生する**
   - Node.jsのバージョンを確認してください（v18以降推奨）
   - `npm install`を再実行してください

3. **データファイルが見つからない**
   - `data/design.json`ファイルが存在することを確認してください
   - 初回実行時には自動的に空のファイルが作成されます

#### ログの確認

MCPサーバーのログは、VS Codeの開発者ツールまたはClineの出力パネルで確認できます。

### 開発情報

#### スクリプト

- `npm run build` - TypeScriptのコンパイル
- `npm run start` - サーバーの直接実行（デバッグ用）
- `npm run dev` - ビルドしてから実行

#### データ形式

データファイル（`data/design.json`）の詳細な形式については、`template/design.json`を参照してください。

### ライセンス

ISC License

### 貢献

このプロジェクトは開発中です。改善提案や不具合報告をお待ちしています。
