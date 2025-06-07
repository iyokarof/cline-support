import { RestServer } from '../../rest/RestServer.js';
import { FileSystemFeatureRepository } from '../../persistence/FileSystemFeatureRepository.js';
import { FileSystemTermRepository } from '../../persistence/FileSystemTermRepository.js';
import { Result } from '../../../shared/types/functional.js';

// Expressのモック
const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  listen: jest.fn(),
  close: jest.fn()
};

const mockRouter = {
  post: jest.fn(),
  delete: jest.fn(),
  get: jest.fn()
};

const mockServer = {
  close: jest.fn((callback: () => void) => {
    callback();
  })
};

// Expressとその関連のモック
jest.mock('express', () => {
  const mockExpress = jest.fn(() => mockApp);
  Object.assign(mockExpress, {
    json: jest.fn(() => 'json-middleware'),
    urlencoded: jest.fn(() => 'urlencoded-middleware'),
    Router: jest.fn(() => mockRouter)
  });
  return mockExpress;
});

jest.mock('cors', () => {
  return jest.fn(() => 'cors-middleware');
});

// モックの設定
jest.mock('../../persistence/FileSystemFeatureRepository.js');
jest.mock('../../persistence/FileSystemTermRepository.js');
jest.mock('../../../application/usecases/AddOrUpdateFeatureUseCase.js');
jest.mock('../../../application/usecases/DeleteFeatureUseCase.js');
jest.mock('../../../application/usecases/AddOrUpdateTermUseCase.js');
jest.mock('../../../application/usecases/DeleteTermUseCase.js');
jest.mock('../../../application/usecases/GetDetailsUseCase.js');
jest.mock('../../../presentation/handlers/RestHandlers.js');

// モックされたクラスの型定義
const MockedFeatureRepository = FileSystemFeatureRepository as jest.MockedClass<typeof FileSystemFeatureRepository>;
const MockedTermRepository = FileSystemTermRepository as jest.MockedClass<typeof FileSystemTermRepository>;

describe('RestServer', () => {
  let server: RestServer;
  let mockFeatureRepository: jest.Mocked<FileSystemFeatureRepository>;
  let mockTermRepository: jest.Mocked<FileSystemTermRepository>;

  // コンソールのモック（ログ出力を制御）
  let consoleSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // コンソールログのモック
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // リポジトリのモック設定
    mockFeatureRepository = new MockedFeatureRepository() as jest.Mocked<FileSystemFeatureRepository>;
    mockTermRepository = new MockedTermRepository() as jest.Mocked<FileSystemTermRepository>;

    // デフォルトのモック実装
    mockFeatureRepository.count.mockResolvedValue(Result.success(5));
    mockTermRepository.count.mockResolvedValue(Result.success(3));

    // Expressアプリのモック実装
    mockApp.listen.mockImplementation((port: number, host: string, callback: () => void) => {
      callback();
      return mockServer;
    });

    server = new RestServer();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('依存関係が正しく構築される', () => {
      expect(MockedFeatureRepository).toHaveBeenCalledTimes(1);
      expect(MockedTermRepository).toHaveBeenCalledTimes(1);
    });

    it('Expressアプリケーションが正しく設定される', () => {
      // ミドルウェアが設定されることを確認
      expect(mockApp.use).toHaveBeenCalledWith('cors-middleware');
      expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
      expect(mockApp.use).toHaveBeenCalledWith('urlencoded-middleware');
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // ログミドルウェア
      expect(mockApp.use).toHaveBeenCalledWith('/api', mockRouter); // APIルーター
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // 404ハンドラー
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // エラーハンドラー
    });

    it('ルートが正しく設定される', () => {
      // APIルートが設定されることを確認
      expect(mockRouter.post).toHaveBeenCalledWith('/features', expect.any(Function));
      expect(mockRouter.delete).toHaveBeenCalledWith('/features/:name', expect.any(Function));
      expect(mockRouter.post).toHaveBeenCalledWith('/terms', expect.any(Function));
      expect(mockRouter.delete).toHaveBeenCalledWith('/terms/:name', expect.any(Function));
      expect(mockRouter.post).toHaveBeenCalledWith('/details', expect.any(Function));
      expect(mockRouter.get).toHaveBeenCalledWith('/resources/features', expect.any(Function));
      expect(mockRouter.get).toHaveBeenCalledWith('/resources/terms', expect.any(Function));
      expect(mockRouter.get).toHaveBeenCalledWith('/resources/statistics', expect.any(Function));
      expect(mockRouter.get).toHaveBeenCalledWith('/health', expect.any(Function));

      // ルートページが設定されることを確認
      expect(mockApp.get).toHaveBeenCalledWith('/', expect.any(Function));
    });
  });

  describe('run', () => {
    it('正常にサーバーを開始できる', async () => {
      // 実行
      await server.run();

      // 検証
      expect(mockFeatureRepository.count).toHaveBeenCalledTimes(1);
      expect(mockTermRepository.count).toHaveBeenCalledTimes(1);
      expect(mockApp.listen).toHaveBeenCalledWith(3001, 'localhost', expect.any(Function));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('機能定義: 5件, ユビキタス言語: 3件')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀 REST APIサーバーが起動しました')
      );
    });

    it('初期化でリポジトリエラーが発生してもサーバーは起動する', async () => {
      // 準備：リポジトリでエラーを発生させる
      mockFeatureRepository.count.mockResolvedValue(Result.failure(new Error('Repository error')));

      // 実行
      await server.run();

      // 検証：エラーログが出力されるがサーバーは起動する
      expect(consoleSpy).toHaveBeenCalledWith(
        '機能定義の初期化に失敗:',
        'Repository error'
      );
      expect(mockApp.listen).toHaveBeenCalledTimes(1);
    });

    it('サーバー起動エラーが発生した場合はプロセスが終了する', async () => {
      // 準備：サーバー起動でエラーを発生させる
      const startupError = new Error('Server startup failed');
      mockApp.listen.mockImplementation(() => {
        throw startupError;
      });

      // プロセス終了のモック
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // 実行と検証
      await expect(server.run()).rejects.toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('REST APIサーバーの起動に失敗しました:', startupError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);

      // クリーンアップ
      mockProcessExit.mockRestore();
    });
  });

  describe('shutdown', () => {
    it('正常にサーバーを停止できる', async () => {
      // サーバーを先に起動
      await server.run();

      // 実行
      await server.shutdown();

      // 検証
      expect(mockServer.close).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('REST APIサーバーが正常に停止しました');
    });

    it('サーバーが起動していない場合は何も行わない', async () => {
      // サーバーを起動せずに停止を試行
      await server.shutdown();

      // 検証：closeが呼ばれない
      expect(mockServer.close).not.toHaveBeenCalled();
    });

    it('サーバー停止時にエラーが発生した場合はエラーログが出力される', async () => {
      // サーバーを先に起動
      await server.run();

      // 準備：サーバー停止でエラーを発生させる
      const shutdownError = new Error('Shutdown failed');
      mockServer.close.mockImplementation((callback: (error?: Error) => void) => {
        callback(shutdownError);
      });

      // 実行
      await server.shutdown();

      // 検証
      expect(consoleSpy).toHaveBeenCalledWith('REST APIサーバーの停止中にエラーが発生:', shutdownError);
    });
  });

  describe('healthCheck', () => {
    it('正常な状態でhealthyを返す', async () => {
      // 実行
      const result = await server.healthCheck();

      // 検証
      expect(result.status).toBe('healthy');
      expect(result.details.featureRepository).toBe(true);
      expect(result.details.termRepository).toBe(true);
      expect(mockFeatureRepository.count).toHaveBeenCalledTimes(1);
      expect(mockTermRepository.count).toHaveBeenCalledTimes(1);
    });

    it('機能リポジトリでエラーが発生した場合はunhealthyを返す', async () => {
      // 準備：機能リポジトリでエラーを発生させる
      mockFeatureRepository.count.mockResolvedValue(Result.failure(new Error('Feature repo error')));

      // 実行
      const result = await server.healthCheck();

      // 検証
      expect(result.status).toBe('unhealthy');
      expect(result.details.featureRepository).toBe(false);
      expect(result.details.termRepository).toBe(true);
    });

    it('用語リポジトリでエラーが発生した場合はunhealthyを返す', async () => {
      // 準備：用語リポジトリでエラーを発生させる
      mockTermRepository.count.mockResolvedValue(Result.failure(new Error('Term repo error')));

      // 実行
      const result = await server.healthCheck();

      // 検証
      expect(result.status).toBe('unhealthy');
      expect(result.details.featureRepository).toBe(true);
      expect(result.details.termRepository).toBe(false);
    });

    it('両方のリポジトリでエラーが発生した場合はunhealthyを返す', async () => {
      // 準備：両方のリポジトリでエラーを発生させる
      mockFeatureRepository.count.mockResolvedValue(Result.failure(new Error('Feature repo error')));
      mockTermRepository.count.mockResolvedValue(Result.failure(new Error('Term repo error')));

      // 実行
      const result = await server.healthCheck();

      // 検証
      expect(result.status).toBe('unhealthy');
      expect(result.details.featureRepository).toBe(false);
      expect(result.details.termRepository).toBe(false);
    });

    it('例外が発生した場合はunhealthyを返す', async () => {
      // 準備：例外を発生させる
      mockFeatureRepository.count.mockRejectedValue(new Error('Unexpected error'));

      // 実行
      const result = await server.healthCheck();

      // 検証
      expect(result.status).toBe('unhealthy');
      expect(result.details.featureRepository).toBe(false);
      expect(result.details.termRepository).toBe(false);
    });
  });

  describe('middleware setup', () => {
    it('ログミドルウェアが正しく動作する', () => {
      // ログミドルウェアを取得
      const logMiddleware = mockApp.use.mock.calls.find(
        call => typeof call[0] === 'function' && call[0].length === 3
      )?.[0];
      
      expect(logMiddleware).toBeDefined();

      // モックのリクエスト、レスポンス、next関数
      const mockReq = { method: 'GET', path: '/test' };
      const mockRes = {};
      const mockNext = jest.fn();

      // ログミドルウェアを実行
      logMiddleware(mockReq, mockRes, mockNext);

      // 検証：ログが出力され、nextが呼ばれる
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /test')
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('404ハンドラーが正しく動作する', () => {
      // 404ハンドラーを取得（4番目のuse呼び出し）
      const notFoundHandler = mockApp.use.mock.calls.find(
        call => typeof call[0] === 'function' && call[0].length === 2
      )?.[0];
      
      expect(notFoundHandler).toBeDefined();

      // モックのリクエストとレスポンス
      const mockReq = { method: 'GET', path: '/nonexistent' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // 404ハンドラーを実行
      notFoundHandler(mockReq, mockRes);

      // 検証：404レスポンスが返される
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: expect.stringContaining('エンドポイント GET /nonexistent が見つかりません'),
        timestamp: expect.any(String)
      });
    });

    it('エラーハンドラーが正しく動作する', () => {
      // エラーハンドラーを取得（4パラメータの関数）
      const errorHandler = mockApp.use.mock.calls.find(
        call => typeof call[0] === 'function' && call[0].length === 4
      )?.[0];
      
      expect(errorHandler).toBeDefined();

      // モックのエラー、リクエスト、レスポンス、next関数
      const mockError = new Error('Test error');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // エラーハンドラーを実行
      errorHandler(mockError, mockReq, mockRes, mockNext);

      // 検証：エラーログが出力され、500レスポンスが返される
      expect(consoleSpy).toHaveBeenCalledWith('REST APIエラー:', mockError);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Test error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('signal handling', () => {
    let mockProcessOn: jest.SpyInstance;
    let mockProcessExit: jest.SpyInstance;

    beforeEach(() => {
      mockProcessOn = jest.spyOn(process, 'on').mockImplementation(() => process);
      mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
    });

    afterEach(() => {
      mockProcessOn.mockRestore();
      mockProcessExit.mockRestore();
    });

    it('SIGINTシグナルハンドラーが設定される', () => {
      // サーバーを作成（コンストラクタでシグナルハンドラーが設定される）
      new RestServer();

      // 検証：SIGINTハンドラーが設定される
      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('SIGTERMシグナルハンドラーが設定される', () => {
      // サーバーを作成
      new RestServer();

      // 検証：SIGTERMハンドラーが設定される
      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('SIGINTシグナル受信時にサーバーが正常終了する', async () => {
      // サーバーを作成して起動
      const testServer = new RestServer();
      await testServer.run();

      // SIGINTハンドラーを取得
      const sigintHandler = mockProcessOn.mock.calls.find(call => call[0] === 'SIGINT')?.[1];
      expect(sigintHandler).toBeDefined();

      // SIGINTハンドラーを実行
      try {
        await sigintHandler();
      } catch (error) {
        // process.exit が呼ばれるため例外が発生する
        expect(error).toEqual(new Error('process.exit called'));
      }

      // 検証：サーバーが正常終了される
      expect(consoleLogSpy).toHaveBeenCalledWith('\n停止シグナルを受信しました...');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('SIGTERMシグナル受信時にサーバーが正常終了する', async () => {
      // サーバーを作成して起動
      const testServer = new RestServer();
      await testServer.run();

      // SIGTERMハンドラーを取得
      const sigtermHandler = mockProcessOn.mock.calls.find(call => call[0] === 'SIGTERM')?.[1];
      expect(sigtermHandler).toBeDefined();

      // SIGTERMハンドラーを実行
      try {
        await sigtermHandler();
      } catch (error) {
        // process.exit が呼ばれるため例外が発生する
        expect(error).toEqual(new Error('process.exit called'));
      }

      // 検証：サーバーが正常終了される
      expect(consoleLogSpy).toHaveBeenCalledWith('\n終了シグナルを受信しました...');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe('initializeData', () => {
    it('初期化データが正常に読み込まれる', async () => {
      // run()を呼び出して初期化をテスト
      await server.run();

      // 検証：統計情報が取得され、ログが出力される
      expect(mockFeatureRepository.count).toHaveBeenCalledTimes(1);
      expect(mockTermRepository.count).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('機能定義: 5件, ユビキタス言語: 3件')
      );
    });
  });
});
