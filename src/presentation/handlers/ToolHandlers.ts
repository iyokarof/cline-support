import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AddOrUpdateFeatureUseCase } from '../../application/usecases/AddOrUpdateFeatureUseCase.js';
import { DeleteFeatureUseCase } from '../../application/usecases/DeleteFeatureUseCase.js';
import { AddOrUpdateTermUseCase } from '../../application/usecases/AddOrUpdateTermUseCase.js';
import { DeleteTermUseCase } from '../../application/usecases/DeleteTermUseCase.js';
import { GetDetailsUseCase } from '../../application/usecases/GetDetailsUseCase.js';
import { MESSAGES } from '../../shared/constants/messages.js';
import { CONFIG } from '../../shared/constants/config.js';
import {
  addOrUpdateFeatureSchema,
  addOrUpdateTermSchema,
  deleteFeatureSchema,
  deleteTermSchema,
  getDetailsSchema,
} from '../../schemas/toolSchemas.js';

/**
 * MCPツールハンドラーのプレゼンテーション層実装
 * クリーンアーキテクチャに基づき、ユースケースを呼び出してビジネスロジックを実行
 */
export class ToolHandlers {
  constructor(
    private readonly server: Server,
    private readonly addOrUpdateFeatureUseCase: AddOrUpdateFeatureUseCase,
    private readonly deleteFeatureUseCase: DeleteFeatureUseCase,
    private readonly addOrUpdateTermUseCase: AddOrUpdateTermUseCase,
    private readonly deleteTermUseCase: DeleteTermUseCase,
    private readonly getDetailsUseCase: GetDetailsUseCase
  ) {}

  /**
   * ツールハンドラーを設定する
   */
  setup(): void {
    this.setupListToolsHandler();
    this.setupCallToolHandler();
  }

  /**
   * 利用可能なツール一覧を提供するハンドラー
   */
  private setupListToolsHandler(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: CONFIG.TOOL_NAMES.ADD_OR_UPDATE_FEATURE,
          description: '機能定義を追加または更新します。既存の機能名の場合は更新、新しい機能名の場合は追加されます。',
          inputSchema: addOrUpdateFeatureSchema,
        },
        {
          name: CONFIG.TOOL_NAMES.DELETE_FEATURE,
          description: '指定された機能名の機能定義を削除します。',
          inputSchema: deleteFeatureSchema,
        },
        {
          name: CONFIG.TOOL_NAMES.ADD_OR_UPDATE_TERM,
          description: 'ユビキタス言語情報を追加または更新します。既存の用語名の場合は更新、新しい用語名の場合は追加されます。',
          inputSchema: addOrUpdateTermSchema,
        },
        {
          name: CONFIG.TOOL_NAMES.DELETE_TERM,
          description: '指定された用語名のユビキタス言語情報を削除します。',
          inputSchema: deleteTermSchema,
        },
        {
          name: CONFIG.TOOL_NAMES.GET_DETAILS,
          description: '指定された機能定義とユビキタス言語情報の詳細を一括で取得します。',
          inputSchema: getDetailsSchema,
        },
      ],
    }));
  }

  /**
   * ツールの実行処理を管理するハンドラー
   */
  private setupCallToolHandler(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case CONFIG.TOOL_NAMES.ADD_OR_UPDATE_FEATURE:
            return await this.handleAddOrUpdateFeature(args);

          case CONFIG.TOOL_NAMES.DELETE_FEATURE:
            return await this.handleDeleteFeature(args);

          case CONFIG.TOOL_NAMES.ADD_OR_UPDATE_TERM:
            return await this.handleAddOrUpdateTerm(args);

          case CONFIG.TOOL_NAMES.DELETE_TERM:
            return await this.handleDeleteTerm(args);

          case CONFIG.TOOL_NAMES.GET_DETAILS:
            return await this.handleGetDetails(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              MESSAGES.ERROR.UNKNOWN_TOOL(name)
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: MESSAGES.ERROR.TOOL_EXECUTION_FAILED(
                error instanceof Error ? error.message : String(error)
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 機能定義の追加・更新処理
   */
  private async handleAddOrUpdateFeature(args: any) {
    // 入力検証
    const validationResult = this.addOrUpdateFeatureUseCase.validateInput(args?.feature);
    if (!validationResult.success) {
      return {
        content: [
          {
            type: 'text',
            text: validationResult.error.message,
          },
        ],
        isError: true,
      };
    }

    // ユースケースの実行
    const result = await this.addOrUpdateFeatureUseCase.execute(args.feature);
    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: result.error.message,
          },
        ],
        isError: true,
      };
    }

    // 成功レスポンスの生成
    const featureName = args.feature.feature.name;
    const message = result.value.isUpdate 
      ? MESSAGES.SUCCESS.FEATURE_UPDATED(featureName)
      : MESSAGES.SUCCESS.FEATURE_ADDED(featureName);

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
  }

  /**
   * 機能定義の削除処理
   */
  private async handleDeleteFeature(args: any) {
    // 入力検証
    const validationResult = this.deleteFeatureUseCase.validateInput(args?.featureName);
    if (!validationResult.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        validationResult.error.message
      );
    }

    // ユースケースの実行
    const result = await this.deleteFeatureUseCase.execute(args.featureName);
    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: result.error.message,
          },
        ],
        isError: true,
      };
    }

    // 結果に応じたレスポンス生成
    if (!result.value.found) {
      return {
        content: [
          {
            type: 'text',
            text: MESSAGES.ERROR.FEATURE_NOT_FOUND(args.featureName),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: MESSAGES.SUCCESS.FEATURE_DELETED(args.featureName),
        },
      ],
    };
  }

  /**
   * ユビキタス言語情報の削除処理
   */
  private async handleDeleteTerm(args: any) {
    // 入力検証
    const validationResult = this.deleteTermUseCase.validateInput(args?.termName);
    if (!validationResult.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        validationResult.error.message
      );
    }

    // ユースケースの実行
    const result = await this.deleteTermUseCase.execute(args.termName);
    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: result.error.message,
          },
        ],
        isError: true,
      };
    }

    // 結果に応じたレスポンス生成
    if (!result.value.found) {
      return {
        content: [
          {
            type: 'text',
            text: MESSAGES.ERROR.TERM_NOT_FOUND(args.termName),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: MESSAGES.SUCCESS.TERM_DELETED(args.termName),
        },
      ],
    };
  }

  /**
   * ユビキタス言語情報の追加・更新処理
   */
  private async handleAddOrUpdateTerm(args: any) {
    // 入力検証
    const validationResult = this.addOrUpdateTermUseCase.validateInput(args?.term);
    if (!validationResult.success) {
      return {
        content: [
          {
            type: 'text',
            text: validationResult.error.message,
          },
        ],
        isError: true,
      };
    }

    // ユースケースの実行
    const result = await this.addOrUpdateTermUseCase.execute(args.term);
    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: result.error.message,
          },
        ],
        isError: true,
      };
    }

    // 成功レスポンスの生成
    const termName = args.term.term.name;
    const message = result.value.isUpdate 
      ? MESSAGES.SUCCESS.TERM_UPDATED(termName)
      : MESSAGES.SUCCESS.TERM_ADDED(termName);

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
  }

  /**
   * 詳細情報の取得処理
   */
  private async handleGetDetails(args: any) {
    // 入力検証
    const validationResult = this.getDetailsUseCase.validateInput(
      args?.featureNames, 
      args?.termNames
    );
    if (!validationResult.success) {
      return {
        content: [
          {
            type: 'text',
            text: validationResult.error.message,
          },
        ],
        isError: true,
      };
    }

    // ユースケースの実行
    const result = await this.getDetailsUseCase.execute(
      args?.featureNames, 
      args?.termNames
    );
    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: result.error.message,
          },
        ],
        isError: true,
      };
    }

    // レスポンスメッセージの構築
    let message = MESSAGES.SUCCESS.DETAILS_RETRIEVED();

    if (result.value.features.length > 0) {
      message += MESSAGES.INFO.FEATURES_SECTION(result.value.features.length);
      result.value.features.forEach(feature => {
        message += `- ${feature.feature.name}: ${feature.feature.purpose}\n`;
      });
      message += '\n';
    }

    if (result.value.terms.length > 0) {
      message += MESSAGES.INFO.TERMS_SECTION(result.value.terms.length);
      result.value.terms.forEach(term => {
        message += `- ${term.term.name}: ${term.term.definition}\n`;
      });
      message += '\n';
    }

    if (result.value.notFound.featureNames.length > 0 || result.value.notFound.termNames.length > 0) {
      message += MESSAGES.INFO.NOT_FOUND_SECTION();
      if (result.value.notFound.featureNames.length > 0) {
        message += `機能定義: ${result.value.notFound.featureNames.join(', ')}\n`;
      }
      if (result.value.notFound.termNames.length > 0) {
        message += `ユビキタス言語: ${result.value.notFound.termNames.join(', ')}\n`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
        {
          type: 'text',
          text: JSON.stringify(result.value, null, 2),
        },
      ],
    };
  }
}
