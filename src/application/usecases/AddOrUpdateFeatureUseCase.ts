import { Feature } from '../../domain/entities/Feature';
import { FeatureName } from '../../domain/valueObjects/FeatureName';
import { IFeatureRepository } from '../../domain/repositories/IFeatureRepository';
import { FeatureData, OperationResultData } from '../../domain/types';
import { Result } from '../../shared/types/functional';

/**
 * 機能定義追加・更新ユースケース
 * 機能定義の追加または更新に関するビジネスロジックを管理
 */
export class AddOrUpdateFeatureUseCase {
  constructor(
    private readonly featureRepository: IFeatureRepository
  ) {}

  /**
   * 機能定義を追加または更新する
   * @param featureData 機能定義データ
   * @returns 操作結果
   */
  async execute(featureData: FeatureData): Promise<Result<OperationResultData, Error>> {
    try {
      // 1. 機能定義エンティティの作成（バリデーション含む）
      const featureResult = Feature.create(featureData);
      if (!featureResult.success) {
        return Result.failure(featureResult.error);
      }

      const feature = featureResult.value;

      // 2. 既存機能の存在確認
      const existsResult = await this.featureRepository.exists(feature.name);
      if (!existsResult.success) {
        return Result.failure(existsResult.error);
      }

      // 3. 機能定義の保存
      const saveResult = await this.featureRepository.save(feature);
      if (!saveResult.success) {
        return Result.failure(saveResult.error);
      }

      // 4. 操作結果の返却
      return Result.success(saveResult.value);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`機能定義の追加・更新中に予期しないエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 機能定義データの事前検証
   * ユースケース実行前の軽量な検証
   */
  validateInput(featureData: any): Result<void, Error> {
    if (!featureData || typeof featureData !== 'object') {
      return Result.failure(new Error('機能定義データが提供されていません'));
    }

    if (!featureData.feature || typeof featureData.feature !== 'object') {
      return Result.failure(new Error('機能基本情報が不正です'));
    }

    if (!featureData.feature.name || typeof featureData.feature.name !== 'string') {
      return Result.failure(new Error('機能名が不正です'));
    }

    // 機能名の形式チェック
    if (!FeatureName.isValid(featureData.feature.name)) {
      return Result.failure(new Error('機能名の形式が不正です'));
    }

    return Result.success(undefined);
  }

  /**
   * 依存関係の整合性チェック
   * 関連する用語定義の存在確認など
   */
  async validateDependencies(featureData: FeatureData): Promise<Result<void, Error>> {
    // 将来的にTermRepositoryとの整合性チェックなどを実装
    // 現在は成功を返す
    return Result.success(undefined);
  }

  /**
   * 機能定義の更新権限チェック
   * 将来的な権限管理のためのプレースホルダー
   */
  async checkUpdatePermission(featureName: FeatureName): Promise<Result<boolean, Error>> {
    // 現在は常に更新可能として処理
    return Result.success(true);
  }
}
