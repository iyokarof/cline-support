import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types';
import { Server } from '@modelcontextprotocol/sdk/server/index';
import { IFeatureRepository } from '../../domain/repositories/IFeatureRepository';
import { ITermRepository } from '../../domain/repositories/ITermRepository';
import { CONFIG } from '../../shared/constants/config';
import { MESSAGES } from '../../shared/constants/messages';

/**
 * MCPリソースハンドラーのプレゼンテーション層実装
 * クリーンアーキテクチャに基づき、リポジトリを通じてデータを取得
 */
export class ResourceHandlers {
  constructor(
    private readonly server: Server,
    private readonly featureRepository: IFeatureRepository,
    private readonly termRepository: ITermRepository
  ) {}

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
          uri: CONFIG.RESOURCE_URIS.FEATURES_LIST,
          name: '機能定義一覧',
          mimeType: CONFIG.MIME_TYPES.JSON,
          description: 'プロジェクトに定義されている全機能の概要一覧（索引）',
        },
        {
          uri: CONFIG.RESOURCE_URIS.TERMS_LIST,
          name: 'ユビキタス言語一覧',
          mimeType: CONFIG.MIME_TYPES.JSON,
          description: 'プロジェクトに定義されている全ユビキタス言語の概要一覧（索引）',
        },
        {
          uri: CONFIG.RESOURCE_URIS.STATISTICS,
          name: '設計書統計情報',
          mimeType: CONFIG.MIME_TYPES.JSON,
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
          case CONFIG.RESOURCE_URIS.FEATURES_LIST:
            content = await this.getFeaturesList();
            description = '機能定義一覧の索引';
            break;

          case CONFIG.RESOURCE_URIS.TERMS_LIST:
            content = await this.getTermsList();
            description = 'ユビキタス言語一覧の索引';
            break;

          case CONFIG.RESOURCE_URIS.STATISTICS:
            content = await this.getStatistics();
            description = '設計書の統計情報';
            break;

          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              MESSAGES.ERROR.UNKNOWN_RESOURCE(uri)
            );
        }

        return {
          contents: [
            {
              uri,
              mimeType: CONFIG.MIME_TYPES.JSON,
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
          MESSAGES.ERROR.RESOURCE_FETCH_FAILED(
            error instanceof Error ? error.message : String(error)
          )
        );
      }
    });
  }

  /**
   * 機能定義一覧を取得する
   */
  private async getFeaturesList(): Promise<any> {
    const result = await this.featureRepository.getList();
    if (!result.success) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * ユビキタス言語一覧を取得する
   */
  private async getTermsList(): Promise<any> {
    const result = await this.termRepository.getList();
    if (!result.success) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * 統計情報を取得する
   */
  private async getStatistics(): Promise<any> {
    try {
      // 機能定義数を取得
      const featureCountResult = await this.featureRepository.count();
      if (!featureCountResult.success) {
        throw featureCountResult.error;
      }

      // ユビキタス言語情報数を取得
      const termCountResult = await this.termRepository.count();
      if (!termCountResult.success) {
        throw termCountResult.error;
      }

      return {
        featureCount: featureCountResult.value,
        termCount: termCountResult.value,
      };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error(`統計情報の取得中にエラーが発生しました: ${String(error)}`);
    }
  }
}
