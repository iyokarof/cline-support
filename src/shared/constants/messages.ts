/**
 * システム全体で使用するメッセージ定数
 */
export const MESSAGES = {
  /** 成功メッセージ */
  SUCCESS: {
    FEATURE_ADDED: (name: string) => `機能定義「${name}」を追加しました。`,
    FEATURE_UPDATED: (name: string) => `機能定義「${name}」を更新しました。`,
    FEATURE_DELETED: (name: string) => `機能定義「${name}」を削除しました。`,
    TERM_ADDED: (name: string) => `ユビキタス言語情報「${name}」を追加しました。`,
    TERM_UPDATED: (name: string) => `ユビキタス言語情報「${name}」を更新しました。`,
    TERM_DELETED: (name: string) => `ユビキタス言語情報「${name}」を削除しました。`,
    DETAILS_RETRIEVED: () => '詳細情報を取得しました。\n\n',
  },

  /** エラーメッセージ */
  ERROR: {
    INVALID_FEATURE_FORMAT: () => '無効な機能定義形式です。正確なスキーマに従った機能定義を提供してください。',
    INVALID_TERM_FORMAT: () => '無効なユビキタス言語情報形式です。正確なスキーマに従った用語定義を提供してください。',
    FEATURE_NOT_FOUND: (name: string) => `機能定義「${name}」は見つかりませんでした。`,
    TERM_NOT_FOUND: (name: string) => `ユビキタス言語情報「${name}」は見つかりませんでした。`,
    FEATURE_NAME_REQUIRED: () => '機能名が指定されていません',
    TERM_NAME_REQUIRED: () => '用語名が指定されていません',
    INVALID_PARAMS: () => '無効なパラメータです',
    UNKNOWN_TOOL: (name: string) => `不明なツール: ${name}`,
    UNKNOWN_RESOURCE: (uri: string) => `不明なリソースURI: ${uri}`,
    DESIGN_SAVE_FAILED: (error: string) => `設計書の保存に失敗しました: ${error}`,
    DESIGN_LOAD_FAILED: (error: string) => `設計書ファイルの読み込みに失敗しました: ${error}`,
    RESOURCE_FETCH_FAILED: (error: string) => `リソースの取得中にエラーが発生しました: ${error}`,
    TOOL_EXECUTION_FAILED: (error: string) => `ツール実行エラー: ${error}`,
    EMPTY_DETAILS_PARAMS: () => 
      'featureNamesまたはtermNamesのいずれかを指定してください。\n' +
      '利用可能な項目を確認するには、以下のリソースをご利用ください:\n' +
      '- 機能定義一覧: design://features/list\n' +
      '- ユビキタス言語一覧: design://terms/list',
  },

  /** 情報メッセージ */
  INFO: {
    DESIGN_LOADED: (featureCount: number, termCount: number) => 
      `設計書を読み込みました: 機能定義 ${featureCount}件, 用語 ${termCount}件`,
    SERVER_RUNNING: () => 'Cline Support MCP Server running on stdio',
    MCP_ERROR: () => '[MCP Error]',
    FEATURES_SECTION: (count: number) => `機能定義（${count}件）:\n`,
    TERMS_SECTION: (count: number) => `ユビキタス言語（${count}件）:\n`,
    NOT_FOUND_SECTION: () => '見つからなかった項目:\n',
  }
} as const;
