import express from 'express';
import cors from 'cors';
import { FileSystemFeatureRepository } from '../persistence/FileSystemFeatureRepository.js';
import { FileSystemTermRepository } from '../persistence/FileSystemTermRepository.js';
import { AddOrUpdateFeatureUseCase } from '../../application/usecases/AddOrUpdateFeatureUseCase.js';
import { DeleteFeatureUseCase } from '../../application/usecases/DeleteFeatureUseCase.js';
import { AddOrUpdateTermUseCase } from '../../application/usecases/AddOrUpdateTermUseCase.js';
import { DeleteTermUseCase } from '../../application/usecases/DeleteTermUseCase.js';
import { GetDetailsUseCase } from '../../application/usecases/GetDetailsUseCase.js';
import { RestHandlers } from '../../presentation/handlers/RestHandlers.js';
import { CONFIG } from '../../shared/constants/config.js';
import { MESSAGES } from '../../shared/constants/messages.js';

/**
 * REST APIサーバー
 * 既存のMCPサーバーと同等の機能をREST APIとして提供
 * クリーンアーキテクチャとDDDの原則に基づいて設計
 */
export class RestServer {
  private readonly app: express.Application;
  private readonly featureRepository: FileSystemFeatureRepository;
  private readonly termRepository: FileSystemTermRepository;
  private readonly addOrUpdateFeatureUseCase: AddOrUpdateFeatureUseCase;
  private readonly deleteFeatureUseCase: DeleteFeatureUseCase;
  private readonly addOrUpdateTermUseCase: AddOrUpdateTermUseCase;
  private readonly deleteTermUseCase: DeleteTermUseCase;
  private readonly getDetailsUseCase: GetDetailsUseCase;
  private readonly restHandlers: RestHandlers;
  private server?: any;

  constructor() {
    this.app = express();

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
    this.restHandlers = new RestHandlers(
      this.addOrUpdateFeatureUseCase,
      this.deleteFeatureUseCase,
      this.addOrUpdateTermUseCase,
      this.deleteTermUseCase,
      this.getDetailsUseCase,
      this.featureRepository,
      this.termRepository
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * ミドルウェアの設定
   */
  private setupMiddleware(): void {
    // CORS設定
    this.app.use(cors({
      origin: CONFIG.REST_API.CORS.ORIGIN,
      methods: [...CONFIG.REST_API.CORS.METHODS],
      allowedHeaders: [...CONFIG.REST_API.CORS.ALLOWED_HEADERS],
    }));

    // JSONパーサー
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // リクエストログ
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * ルートの設定
   */
  private setupRoutes(): void {
    const apiRouter = express.Router();

    // 機能定義関連
    apiRouter.post('/features', this.restHandlers.addOrUpdateFeature.bind(this.restHandlers));
    apiRouter.delete('/features/:name', this.restHandlers.deleteFeature.bind(this.restHandlers));

    // ユビキタス言語関連
    apiRouter.post('/terms', this.restHandlers.addOrUpdateTerm.bind(this.restHandlers));
    apiRouter.delete('/terms/:name', this.restHandlers.deleteTerm.bind(this.restHandlers));

    // 詳細情報取得
    apiRouter.post('/details', this.restHandlers.getDetails.bind(this.restHandlers));

    // リソース関連
    apiRouter.get('/resources/features', this.restHandlers.getFeaturesList.bind(this.restHandlers));
    apiRouter.get('/resources/terms', this.restHandlers.getTermsList.bind(this.restHandlers));
    apiRouter.get('/resources/statistics', this.restHandlers.getStatistics.bind(this.restHandlers));

    // ヘルスチェック
    apiRouter.get('/health', this.restHandlers.healthCheck.bind(this.restHandlers));

    this.app.use(CONFIG.REST_API.BASE_PATH, apiRouter);

    // ルート情報の表示
    this.app.get('/', (req, res) => {
      res.json({
        name: CONFIG.SERVER.NAME,
        version: CONFIG.SERVER.VERSION,
        description: 'clineサポート用REST APIサーバー',
        endpoints: {
          'POST /api/features': '機能定義の追加・更新',
          'DELETE /api/features/:name': '機能定義の削除',
          'POST /api/terms': 'ユビキタス言語の追加・更新',
          'DELETE /api/terms/:name': 'ユビキタス言語の削除',
          'POST /api/details': '詳細情報の取得',
          'GET /api/resources/features': '機能定義一覧の取得',
          'GET /api/resources/terms': 'ユビキタス言語一覧の取得',
          'GET /api/resources/statistics': '統計情報の取得',
          'GET /api/health': 'ヘルスチェック',
        },
      });
    });
  }

  /**
   * エラーハンドリングの設定
   */
  private setupErrorHandling(): void {
    // 404ハンドラー
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `エンドポイント ${req.method} ${req.path} が見つかりません`,
        timestamp: new Date().toISOString(),
      });
    });

    // エラーハンドラー
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('REST APIエラー:', error);

      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      res.status(statusCode).json({
        error: error.name || 'Error',
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });
    });

    // プロセス終了時の処理
    process.on('SIGINT', async () => {
      console.log('\n停止シグナルを受信しました...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n終了シグナルを受信しました...');
      await this.shutdown();
      process.exit(0);
    });
  }

  /**
   * サーバーを開始する
   */
  async run(): Promise<void> {
    try {
      // データの初期化
      await this.initializeData();

      // サーバー起動
      this.server = this.app.listen(CONFIG.REST_API.PORT, CONFIG.REST_API.HOST, () => {
        console.log(`🚀 REST APIサーバーが起動しました`);
        console.log(`📍 URL: http://${CONFIG.REST_API.HOST}:${CONFIG.REST_API.PORT}`);
        console.log(`📊 API: http://${CONFIG.REST_API.HOST}:${CONFIG.REST_API.PORT}${CONFIG.REST_API.BASE_PATH}`);
        console.log(`❤️  ヘルスチェック: http://${CONFIG.REST_API.HOST}:${CONFIG.REST_API.PORT}${CONFIG.REST_API.BASE_PATH}/health`);
      });
    } catch (error) {
      console.error('REST APIサーバーの起動に失敗しました:', error);
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
      console.log(
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
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            console.log('REST APIサーバーが正常に停止しました');
            resolve();
          });
        });
      }
    } catch (error) {
      console.error('REST APIサーバーの停止中にエラーが発生:', error);
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
