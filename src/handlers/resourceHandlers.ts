import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { DataManager } from '../dataManager.js';

/**
 * MCPリソースハンドラーの設定と管理
 */
export class ResourceHandlers {
  private server: Server;
  private dataManager: DataManager;

  constructor(server: Server, dataManager: DataManager) {
    this.server = server;
    this.dataManager = dataManager;
  }

  /**
   * リソースハンドラーを設定する
   */
  setup(): void {
    this.setupListResourcesHandler();
    this.setupReadResourceHandler();
  }

  /**
   * 利用可能なリソース一覧を提供するハンドラー
   */
  private setupListResourcesHandler(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'design://features/list',
          name: '機能定義一覧',
          mimeType: 'application/json',
          description: 'プロジェクトに定義されている全機能の概要一覧（索引）',
        },
        {
          uri: 'design://terms/list',
          name: 'ユビキタス言語一覧',
          mimeType: 'application/json',
          description: 'プロジェクトに定義されている全ユビキタス言語の概要一覧（索引）',
        },
        {
          uri: 'design://statistics',
          name: '設計書統計情報',
          mimeType: 'application/json',
          description: '機能定義数、ユビキタス言語数などの統計情報',
        },
      ],
    }));
  }

  /**
   * リソースの内容を提供するハンドラー
   */
  private setupReadResourceHandler(): void {
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        let content: any;
        let description: string;

        switch (uri) {
          case 'design://features/list':
            content = this.dataManager.getFeatureList();
            description = '機能定義一覧の索引';
            break;

          case 'design://terms/list':
            content = this.dataManager.getTermList();
            description = 'ユビキタス言語一覧の索引';
            break;

          case 'design://statistics':
            content = this.dataManager.getStatistics();
            description = '設計書の統計情報';
            break;

          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              `不明なリソースURI: ${uri}`
            );
        }

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                description,
                data: content,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `リソースの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }
}
