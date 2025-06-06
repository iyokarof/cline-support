import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { DataManager } from '../dataManager.js';
import {
  validateAddOrUpdateFeatureArgs,
  validateDeleteFeatureArgs,
  validateAddOrUpdateTermArgs,
  validateDeleteTermArgs,
  validateGetDetailsArgs,
} from '../validators.js';
import {
  addOrUpdateFeatureSchema,
  addOrUpdateTermSchema,
  deleteFeatureSchema,
  deleteTermSchema,
  getDetailsSchema,
} from '../schemas/toolSchemas.js';

/**
 * MCPツールハンドラーの設定と管理
 */
export class ToolHandlers {
  private server: Server;
  private dataManager: DataManager;

  constructor(server: Server, dataManager: DataManager) {
    this.server = server;
    this.dataManager = dataManager;
  }

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
          name: 'add_or_update_feature',
          description: '機能定義を追加または更新します。既存の機能名の場合は更新、新しい機能名の場合は追加されます。',
          inputSchema: addOrUpdateFeatureSchema,
        },
        {
          name: 'delete_feature',
          description: '指定された機能名の機能定義を削除します。',
          inputSchema: deleteFeatureSchema,
        },
        {
          name: 'add_or_update_term',
          description: 'ユビキタス言語情報を追加または更新します。既存の用語名の場合は更新、新しい用語名の場合は追加されます。',
          inputSchema: addOrUpdateTermSchema,
        },
        {
          name: 'delete_term',
          description: '指定された用語名のユビキタス言語情報を削除します。',
          inputSchema: deleteTermSchema,
        },
        {
          name: 'get_details',
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
          case 'add_or_update_feature':
            return await this.handleAddOrUpdateFeature(args);

          case 'delete_feature':
            return await this.handleDeleteFeature(args);

          case 'add_or_update_term':
            return await this.handleAddOrUpdateTerm(args);

          case 'delete_term':
            return await this.handleDeleteTerm(args);

          case 'get_details':
            return await this.handleGetDetails(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `不明なツール: ${name}`
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
              text: `ツール実行エラー: ${error instanceof Error ? error.message : String(error)}`,
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
    if (!validateAddOrUpdateFeatureArgs(args)) {
      return {
        content: [
          {
            type: 'text',
            text: '無効な機能定義形式です。正確なスキーマに従った機能定義を提供してください。',
          },
        ],
        isError: true,
      };
    }

    const { feature } = args;
    const result = await this.dataManager.addOrUpdateFeature(feature);

    return {
      content: [
        {
          type: 'text',
          text: `機能定義「${feature.feature.name}」を${result.isUpdate ? '更新' : '追加'}しました。`,
        },
      ],
    };
  }

  /**
   * 機能定義の削除処理
   */
  private async handleDeleteFeature(args: any) {
    if (!validateDeleteFeatureArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        '機能名が指定されていません'
      );
    }

    const { featureName } = args;
    const result = await this.dataManager.deleteFeature(featureName);

    if (!result.found) {
      return {
        content: [
          {
            type: 'text',
            text: `機能定義「${featureName}」は見つかりませんでした。`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `機能定義「${featureName}」を削除しました。`,
        },
      ],
    };
  }

  /**
   * ユビキタス言語情報の追加・更新処理
   */
  private async handleAddOrUpdateTerm(args: any) {
    if (!validateAddOrUpdateTermArgs(args)) {
      return {
        content: [
          {
            type: 'text',
            text: '無効なユビキタス言語情報形式です。正確なスキーマに従った用語定義を提供してください。',
          },
        ],
        isError: true,
      };
    }

    const { term } = args;
    const result = await this.dataManager.addOrUpdateTerm(term);

    return {
      content: [
        {
          type: 'text',
          text: `ユビキタス言語情報「${term.term.name}」を${result.isUpdate ? '更新' : '追加'}しました。`,
        },
      ],
    };
  }

  /**
   * ユビキタス言語情報の削除処理
   */
  private async handleDeleteTerm(args: any) {
    if (!validateDeleteTermArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        '用語名が指定されていません'
      );
    }

    const { termName } = args;
    const result = await this.dataManager.deleteTerm(termName);

    if (!result.found) {
      return {
        content: [
          {
            type: 'text',
            text: `ユビキタス言語情報「${termName}」は見つかりませんでした。`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `ユビキタス言語情報「${termName}」を削除しました。`,
        },
      ],
    };
  }

  /**
   * 詳細情報の取得処理
   */
  private async handleGetDetails(args: any) {
    if (!validateGetDetailsArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        '無効なパラメータです'
      );
    }

    const { featureNames, termNames } = args || {};
    const details = this.dataManager.getDetails(featureNames, termNames);

    let message = '詳細情報を取得しました。\n\n';

    if (details.features.length > 0) {
      message += `機能定義（${details.features.length}件）:\n`;
      details.features.forEach(feature => {
        message += `- ${feature.feature.name}: ${feature.feature.purpose}\n`;
      });
      message += '\n';
    }

    if (details.terms.length > 0) {
      message += `ユビキタス言語（${details.terms.length}件）:\n`;
      details.terms.forEach(term => {
        message += `- ${term.term.name}: ${term.term.definition}\n`;
      });
      message += '\n';
    }

    if (details.notFound.featureNames.length > 0 || details.notFound.termNames.length > 0) {
      message += '見つからなかった項目:\n';
      if (details.notFound.featureNames.length > 0) {
        message += `機能定義: ${details.notFound.featureNames.join(', ')}\n`;
      }
      if (details.notFound.termNames.length > 0) {
        message += `ユビキタス言語: ${details.notFound.termNames.join(', ')}\n`;
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
          text: JSON.stringify(details, null, 2),
        },
      ],
    };
  }
}
