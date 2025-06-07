import { ClineSupportServer } from '../../mcp/ClineSupportServer.js';
import { FileSystemFeatureRepository } from '../../persistence/FileSystemFeatureRepository.js';
import { FileSystemTermRepository } from '../../persistence/FileSystemTermRepository.js';
import { Result } from '../../../shared/types/functional.js';

// モックの設定
jest.mock('../../persistence/FileSystemFeatureRepository.js');
jest.mock('../../persistence/FileSystemTermRepository.js');
jest.mock('../../../application/usecases/AddOrUpdateFeatureUseCase.js');
jest.mock('../../../application/usecases/DeleteFeatureUseCase.js');
jest.mock('../../../application/usecases/AddOrUpdateTermUseCase.js');
jest.mock('../../../application/usecases/DeleteTermUseCase.js');
jest.mock('../../../application/usecases/GetDetailsUseCase.js');
jest.mock('../../../presentation/handlers/ToolHandlers.js');
jest.mock('../../../presentation/handlers/ResourceHandlers.js');

// MCPサーバーのモック
const mockServer = {
  connect: jest.fn(),
  close: jest.fn(),
  onerror: null as any
};

const mockTransport = {
  start: jest.fn(),
  close: jest.fn()
};

// MCPサーバー関連のモック
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn(() => mockServer)
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(() => mockTransport)
}));

// モックされたクラスの型定義
const MockedFeatureRepository = FileSystemFeatureRepository as jest.MockedClass<typeof FileSystemFeatureRepository>;
const MockedTermRepository = FileSystemTermRepository as jest.MockedClass<typeof FileSystemTermRepository>;

describe('ClineSupportServer', () => {
  let server: ClineSupportServer;
  let mockFeatureRepository: jest.Mocked<FileSystemFeatureRepository>;
  let mockTermRepository: jest.Mocked<FileSystemTermRepository>;

  // コンソールのモック（ログ出力を制御）
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // コンソールログのモック
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // リポジトリのモック設定
    mockFeatureRepository = new MockedFeatureRepository() as jest.Mocked<FileSystemFeatureRepository>;
    mockTermRepository = new MockedTermRepository() as jest.Mocked<FileSystemTermRepository>;

    // デフォルトのモック実装
    mockFeatureRepository.count.mockResolvedValue(Result.success(5));
    mockTermRepository.count.mockResolvedValue(Result.success(3));

    // MCPサーバーのモック実装
    mockServer.connect.mockResolvedValue(undefined);
    mockServer.close.mockResolvedValue(undefined);

    server = new ClineSupportServer();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('依存関係が正しく構築される', () => {
      expect(MockedFeatureRepository).toHaveBeenCalledTimes(1);
      expect(MockedTermRepository).toHaveBeenCalledTimes(1);
    });

    it('エラーハンドラーが設定される', () => {
      expect(mockServer.onerror).toBeDefined();
    });
  });

  describe('run', () => {
    it('正常にサーバーを開始できる', async () => {
      // 実行
      await server.run();

      // 検証
      expect(mockFeatureRepository.count).toHaveBeenCalledTimes(1);
      expect(mockTermRepository.count).toHaveBeenCalledTimes(1);
      expect(mockServer.connect).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('機能定義: 5件, ユビキタス言語: 3件')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCPサーバーが起動しました')
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
      expect(mockServer.connect).toHaveBeenCalledTimes(1);
    });

    it('サーバー接続エラーが発生した場合はプロセスが終了する', async () => {
      // 準備：サーバー接続でエラーを発生させる
      const connectionError = new Error('Connection failed');
      mockServer.connect.mockRejectedValue(connectionError);

      // プロセス終了のモック
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // 実行と検証
      await expect(server.run()).rejects.toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('サーバーの起動に失敗しました:', connectionError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);

      // クリーンアップ
      mockProcessExit.mockRestore();
    });
  });

  describe('shutdown', () => {
    it('正常にサーバーを停止できる', async () => {
      // 実行
      await server.shutdown();

      // 検証
      expect(mockServer.close).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('サーバーが正常に停止しました');
    });

    it('サーバー停止時にエラーが発生した場合はエラーログが出力される', async () => {
      // 準備：サーバー停止でエラーを発生させる
      const shutdownError = new Error('Shutdown failed');
      mockServer.close.mockRejectedValue(shutdownError);

      // 実行
      await server.shutdown();

      // 検証
      expect(consoleSpy).toHaveBeenCalledWith('サーバーの停止中にエラーが発生:', shutdownError);
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

  describe('initializeData', () => {
    it('初期化データが正常に読み込まれる', async () => {
      // run()を呼び出して初期化をテスト
      await server.run();

      // 検証：統計情報が取得され、ログが出力される
      expect(mockFeatureRepository.count).toHaveBeenCalledTimes(1);
      expect(mockTermRepository.count).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('機能定義: 5件, ユビキタス言語: 3件')
      );
    });
  });

  describe('error handling', () => {
    it('エラーハンドラーが正しく動作する', () => {
      const testError = new Error('Test error');
      
      // エラーハンドラーを呼び出し
      if (mockServer.onerror) {
        mockServer.onerror(testError);
      }

      // 検証：エラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCPサーバーでエラーが発生しました'),
        testError
      );
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
      new ClineSupportServer();

      // 検証：SIGINTハンドラーが設定される
      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('SIGINTシグナル受信時にサーバーが正常終了する', async () => {
      // サーバーを作成
      new ClineSupportServer();

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
      expect(mockServer.close).toHaveBeenCalledTimes(1);
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });
});
