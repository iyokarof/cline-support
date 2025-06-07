/**
 * システム設定定数
 */
export const CONFIG = {
  /** サーバー設定 */
  SERVER: {
    NAME: 'cline-support-server',
    VERSION: '1.0.0',
  },

  /** REST API設定 */
  REST_API: {
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    HOST: process.env.HOST || 'localhost',
    CORS: {
      ORIGIN: process.env.CORS_ORIGIN || '*',
      METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
    },
    BASE_PATH: '/api',
  },

  /** ファイルパス設定 */
  PATHS: {
    DATA_DIRECTORY: '../data',
    DESIGN_DOCUMENT_FILE: 'design.json',
  },

  /** リソースURI */
  RESOURCE_URIS: {
    FEATURES_LIST: 'design://features/list',
    TERMS_LIST: 'design://terms/list',
    STATISTICS: 'design://statistics',
  },

  /** ツール名 */
  TOOL_NAMES: {
    ADD_OR_UPDATE_FEATURE: 'add_or_update_feature',
    DELETE_FEATURE: 'delete_feature',
    ADD_OR_UPDATE_TERM: 'add_or_update_term',
    DELETE_TERM: 'delete_term',
    GET_DETAILS: 'get_details',
  },

  /** MIME タイプ */
  MIME_TYPES: {
    JSON: 'application/json',
  },

  /** バリデーション設定 */
  VALIDATION: {
    MIN_STRING_LENGTH: 1,
    MIN_STEP_NUMBER: 1,
  },

  /** エンコーディング設定 */
  ENCODING: {
    UTF8: 'utf-8' as const,
  }
} as const;
