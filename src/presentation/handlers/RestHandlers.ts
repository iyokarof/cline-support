import { Request, Response } from 'express';
import { AddOrUpdateFeatureUseCase } from '../../application/usecases/AddOrUpdateFeatureUseCase';
import { DeleteFeatureUseCase } from '../../application/usecases/DeleteFeatureUseCase';
import { AddOrUpdateTermUseCase } from '../../application/usecases/AddOrUpdateTermUseCase';
import { DeleteTermUseCase } from '../../application/usecases/DeleteTermUseCase';
import { GetDetailsUseCase } from '../../application/usecases/GetDetailsUseCase';
import { IFeatureRepository } from '../../domain/repositories/IFeatureRepository';
import { ITermRepository } from '../../domain/repositories/ITermRepository';
import { MESSAGES } from '../../shared/constants/messages';

/**
 * REST APIハンドラーのプレゼンテーション層実装
 * 既存のMCPハンドラーと同等の機能をREST APIとして提供
 * クリーンアーキテクチャに基づき、ユースケースを呼び出してビジネスロジックを実行
 */
export class RestHandlers {
  constructor(
    private readonly addOrUpdateFeatureUseCase: AddOrUpdateFeatureUseCase,
    private readonly deleteFeatureUseCase: DeleteFeatureUseCase,
    private readonly addOrUpdateTermUseCase: AddOrUpdateTermUseCase,
    private readonly deleteTermUseCase: DeleteTermUseCase,
    private readonly getDetailsUseCase: GetDetailsUseCase,
    private readonly featureRepository: IFeatureRepository,
    private readonly termRepository: ITermRepository
  ) {}

  /**
   * 機能定義の追加・更新処理
   */
  async addOrUpdateFeature(req: Request, res: Response): Promise<void> {
    try {
      const { feature } = req.body;

      // 入力検証
      const validationResult = this.addOrUpdateFeatureUseCase.validateInput(feature);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: validationResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ユースケースの実行
      const result = await this.addOrUpdateFeatureUseCase.execute(feature);
      if (!result.success) {
        res.status(500).json({
          error: 'Execution Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 成功レスポンスの生成
      const featureName = feature.feature.name;
      const message = result.value.isUpdate 
        ? MESSAGES.SUCCESS.FEATURE_UPDATED(featureName)
        : MESSAGES.SUCCESS.FEATURE_ADDED(featureName);

      res.status(result.value.isUpdate ? 200 : 201).json({
        success: true,
        message,
        data: {
          featureName,
          isUpdate: result.value.isUpdate,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('機能定義追加・更新エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 機能定義の削除処理
   */
  async deleteFeature(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      // 入力検証
      const validationResult = this.deleteFeatureUseCase.validateInput(name);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: validationResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ユースケースの実行
      const result = await this.deleteFeatureUseCase.execute(name);
      if (!result.success) {
        res.status(500).json({
          error: 'Execution Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 結果に応じたレスポンス生成
      if (!result.value.found) {
        res.status(404).json({
          error: 'Not Found',
          message: MESSAGES.ERROR.FEATURE_NOT_FOUND(name),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.FEATURE_DELETED(name),
        data: {
          featureName: name,
          deleted: true,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('機能定義削除エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * ユビキタス言語情報の追加・更新処理
   */
  async addOrUpdateTerm(req: Request, res: Response): Promise<void> {
    try {
      const { term } = req.body;

      // 入力検証
      const validationResult = this.addOrUpdateTermUseCase.validateInput(term);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: validationResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ユースケースの実行
      const result = await this.addOrUpdateTermUseCase.execute(term);
      if (!result.success) {
        res.status(500).json({
          error: 'Execution Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 成功レスポンスの生成
      const termName = term.term.name;
      const message = result.value.isUpdate 
        ? MESSAGES.SUCCESS.TERM_UPDATED(termName)
        : MESSAGES.SUCCESS.TERM_ADDED(termName);

      res.status(result.value.isUpdate ? 200 : 201).json({
        success: true,
        message,
        data: {
          termName,
          isUpdate: result.value.isUpdate,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('ユビキタス言語追加・更新エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * ユビキタス言語情報の削除処理
   */
  async deleteTerm(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      // 入力検証
      const validationResult = this.deleteTermUseCase.validateInput(name);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: validationResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ユースケースの実行
      const result = await this.deleteTermUseCase.execute(name);
      if (!result.success) {
        res.status(500).json({
          error: 'Execution Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 結果に応じたレスポンス生成
      if (!result.value.found) {
        res.status(404).json({
          error: 'Not Found',
          message: MESSAGES.ERROR.TERM_NOT_FOUND(name),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.TERM_DELETED(name),
        data: {
          termName: name,
          deleted: true,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('ユビキタス言語削除エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 詳細情報の取得処理
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const { featureNames, termNames } = req.body;

      // 入力検証
      const validationResult = this.getDetailsUseCase.validateInput(featureNames, termNames);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: validationResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ユースケースの実行
      const result = await this.getDetailsUseCase.execute(featureNames, termNames);
      if (!result.success) {
        res.status(500).json({
          error: 'Execution Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.DETAILS_RETRIEVED(),
        data: result.value,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('詳細情報取得エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 機能定義一覧の取得処理
   */
  async getFeaturesList(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.featureRepository.getList();
      if (!result.success) {
        res.status(500).json({
          error: 'Repository Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '機能定義一覧を取得しました',
        data: result.value,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('機能定義一覧取得エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * ユビキタス言語一覧の取得処理
   */
  async getTermsList(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.termRepository.getList();
      if (!result.success) {
        res.status(500).json({
          error: 'Repository Error',
          message: result.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'ユビキタス言語一覧を取得しました',
        data: result.value,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('ユビキタス言語一覧取得エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 統計情報の取得処理
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      // 機能定義数を取得
      const featureCountResult = await this.featureRepository.count();
      if (!featureCountResult.success) {
        res.status(500).json({
          error: 'Repository Error',
          message: featureCountResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ユビキタス言語情報数を取得
      const termCountResult = await this.termRepository.count();
      if (!termCountResult.success) {
        res.status(500).json({
          error: 'Repository Error',
          message: termCountResult.error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const statistics = {
        featureCount: featureCountResult.value,
        termCount: termCountResult.value,
      };

      res.status(200).json({
        success: true,
        message: '統計情報を取得しました',
        data: statistics,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('統計情報取得エラー:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * ヘルスチェック処理
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // リポジトリの接続確認
      const featureCountResult = await this.featureRepository.count();
      const termCountResult = await this.termRepository.count();

      const featureRepoHealthy = featureCountResult.success;
      const termRepoHealthy = termCountResult.success;

      const isHealthy = featureRepoHealthy && termRepoHealthy;
      const status = isHealthy ? 'healthy' : 'unhealthy';

      const healthData = {
        status,
        timestamp: new Date().toISOString(),
        details: {
          featureRepository: featureRepoHealthy,
          termRepository: termRepoHealthy,
        },
        version: '1.0.0',
        uptime: process.uptime(),
      };

      res.status(isHealthy ? 200 : 503).json(healthData);

    } catch (error) {
      console.error('ヘルスチェックエラー:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          featureRepository: false,
          termRepository: false,
        },
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
