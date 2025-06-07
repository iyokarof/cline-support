import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FileSystemFeatureRepository } from '../persistence/FileSystemFeatureRepository.js';
import { FileSystemTermRepository } from '../persistence/FileSystemTermRepository.js';
import { AddOrUpdateFeatureUseCase } from '../../application/usecases/AddOrUpdateFeatureUseCase.js';
import { DeleteFeatureUseCase } from '../../application/usecases/DeleteFeatureUseCase.js';
import { AddOrUpdateTermUseCase } from '../../application/usecases/AddOrUpdateTermUseCase.js';
import { DeleteTermUseCase } from '../../application/usecases/DeleteTermUseCase.js';
import { GetDetailsUseCase } from '../../application/usecases/GetDetailsUseCase.js';
import { ToolHandlers } from '../../presentation/handlers/ToolHandlers.js';
import { ResourceHandlers } from '../../presentation/handlers/ResourceHandlers.js';
import { CONFIG } from '../../shared/constants/config.js';
import { MESSAGES } from '../../shared/constants/messages.js';

/**
 * clineサポート用MCPサーバー
 * クリーンアーキテクチャとDDDの原則に基づいて再設計
 * 依存注入によりレイヤー間の結合を疎にする
 */
export class ClineSupportServer {
  private readonly server: Server;
  private readonly featureRepository: FileSystemFeatureRepository;
  private readonly termRepository: FileSystemTermRepository;
  private readonly addOrUpdateFeatureUseCase: AddOrUpdateFeatureUseCase;
  private readonly deleteFeatureUseCase: DeleteFeatureUseCase;
  private readonly addOrUpdateTermUseCase: AddOrUpdateTermUseCase;
  private readonly deleteTermUseCase: DeleteTermUseCase;
  private readonly getDetailsUseCase: GetDetailsUseCase;
  private readonly toolHandlers: ToolHandlers;
  private readonly resourceHandlers: ResourceHandlers;

  constructor() {
    // MCPサーバーの初期化
    this.server = new Server(
      {
        name: CONFIG.SERVER.NAME,
        version: CONFIG.SERVER.VERSION,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // 依存関係の構築（下位レイヤーから上位レイヤーへ）
    // インフラストラクチャ層（リポジトリ実装）
    this.featureRepository = new FileSystemFeatureRepository();
    this.termRepository = new FileSystemTermRepository();

    // アプリケーション層（ユースケース）
    this.addOrUpdateFeatureUseCase = new AddOrUpdateFeatureUseCase(
      this.featureRepository
    );
    this.deleteFeatureUseCase = new DeleteFeatureUseCase(
      this.featureRepository
    );
    this.addOrUpdateTermUseCase = new AddOrUpdateTermUseCase(
      this.termRepository
    );
    this.deleteTermUseCase = new DeleteTermUseCase(
      this.termRepository
    );
    this.getDetailsUseCase = new GetDetailsUseCase(
      this.featureRepository,
      this.termRepository
    );

    // プレゼンテーション層（ハンドラー）
    this.toolHandlers = new ToolHandlers(
      this.server,
      this.addOrUpdateFeatureUseCase,
      this.deleteFeatureUseCase,
      this.addOrUpdateTermUseCase,
      this.deleteTermUseCase,
      this.getDetailsUseCase
    );

    this.resourceHandlers = new ResourceHandlers(
      this.server,
      this.featureRepository,
      this.termRepository
    );

    // ハンドラーの設定
    this.toolHandlers.setup();
    this.resourceHandlers.setup();
    
    this.setupErrorHandling();
  }

  /**
   * エラーハンドリングの設定
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error(MESSAGES.INFO.MCP_ERROR(), error);
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * サーバーを開始する
   */
  async run(): Promise<void> {
    try {
      // データの初期化（設計書ファイルの存在確認など）
      await this.initializeData();
      
      // MCPサーバーの接続
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error(MESSAGES.INFO.SERVER_RUNNING());
      
    } catch (error) {
      console.error('サーバーの起動に失敗しました:', error);
      process.exit(1);
    }
  }

  /**
   * データの初期化
   * システム起動時の準備処理
   */
  private async initializeData(): Promise<void> {
    try {
      // 機能定義の統計取得（ファイル存在確認も兼ねる）
      const featureCountResult = await this.featureRepository.count();
      if (!featureCountResult.success) {
        console.error('機能定義の初期化に失敗:', featureCountResult.error.message);
        return;
      }

      // ユビキタス言語情報の統計取得
      const termCountResult = await this.termRepository.count();
      if (!termCountResult.success) {
        console.error('ユビキタス言語情報の初期化に失敗:', termCountResult.error.message);
        return;
      }

      // 初期化完了のログ出力
      console.error(
        MESSAGES.INFO.DESIGN_LOADED(
          featureCountResult.value, 
          termCountResult.value
        )
      );

    } catch (error) {
      console.error('データの初期化中にエラーが発生:', error);
      throw error;
    }
  }

  /**
   * サーバーの正常停止
   */
  async shutdown(): Promise<void> {
    try {
      await this.server.close();
      console.error('サーバーが正常に停止しました');
    } catch (error) {
      console.error('サーバーの停止中にエラーが発生:', error);
    }
  }

  /**
   * ヘルスチェック
   * サーバーの状態確認用
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      featureRepository: boolean;
      termRepository: boolean;
    };
  }> {
    try {
      // リポジトリの接続確認
      const featureCountResult = await this.featureRepository.count();
      const termCountResult = await this.termRepository.count();

      const featureRepoHealthy = featureCountResult.success;
      const termRepoHealthy = termCountResult.success;

      return {
        status: featureRepoHealthy && termRepoHealthy ? 'healthy' : 'unhealthy',
        details: {
          featureRepository: featureRepoHealthy,
          termRepository: termRepoHealthy,
        },
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          featureRepository: false,
          termRepository: false,
        },
      };
    }
  }
}
