import { FeatureName } from '../../domain/valueObjects/FeatureName';
import { IFeatureRepository } from '../../domain/repositories/IFeatureRepository';
import { DeletionResultData } from '../../domain/types';
import { Result } from '../../shared/types/functional';

/**
 * 機能定義削除ユースケース
 * 機能定義の削除に関するビジネスロジックを管理
 */
export class DeleteFeatureUseCase {
  constructor(
    private readonly featureRepository: IFeatureRepository
  ) {}

  /**
   * 機能定義を削除する
   * @param featureName 削除する機能名
   * @returns 削除結果
   */
  async execute(featureName: string): Promise<Result<DeletionResultData, Error>> {
    try {
      // 1. 機能名の検証とValueObjectの作成
      const nameResult = FeatureName.create(featureName);
      if (!nameResult.success) {
        return Result.failure(nameResult.error);
      }

      const name = nameResult.value;

      // 2. 削除権限の確認
      const permissionResult = await this.checkDeletePermission(name);
      if (!permissionResult.success) {
        return Result.failure(permissionResult.error);
      }

      if (!permissionResult.value) {
        return Result.failure(new Error('機能定義を削除する権限がありません'));
      }

      // 3. 依存関係のチェック
      const dependencyResult = await this.checkDependencies(name);
      if (!dependencyResult.success) {
        return Result.failure(dependencyResult.error);
      }

      // 4. 機能定義の削除
      const deleteResult = await this.featureRepository.delete(name);
      if (!deleteResult.success) {
        return Result.failure(deleteResult.error);
      }

      // 5. 削除結果の返却
      return Result.success(deleteResult.value);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`機能定義の削除中に予期しないエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 機能名の事前検証
   * ユースケース実行前の軽量な検証
   */
  validateInput(featureName: any): Result<void, Error> {
    if (!featureName || typeof featureName !== 'string') {
      return Result.failure(new Error('機能名が提供されていません'));
    }

    if (!featureName.trim()) {
      return Result.failure(new Error('機能名は空文字列にできません'));
    }

    // 機能名の形式チェック
    if (!FeatureName.isValid(featureName)) {
      return Result.failure(new Error('機能名の形式が不正です'));
    }

    return Result.success(undefined);
  }

  /**
   * 削除権限の確認
   * 将来的な権限管理のためのプレースホルダー
   */
  private async checkDeletePermission(featureName: FeatureName): Promise<Result<boolean, Error>> {
    // 現在は常に削除可能として処理
    // 将来的には以下のような権限チェックを実装
    // - ユーザーの権限レベル確認
    // - 機能の重要度による削除制限
    // - システム機能の削除禁止
    return Result.success(true);
  }

  /**
   * 依存関係のチェック
   * 削除対象の機能定義が他の機能や用語から参照されていないかを確認
   */
  private async checkDependencies(featureName: FeatureName): Promise<Result<void, Error>> {
    // 将来的に以下のような依存関係チェックを実装
    // - 他の機能定義からの参照確認
    // - ユビキタス言語情報からの参照確認
    // - 実装されたコードからの参照確認
    
    // 現在は依存関係の問題なしとして処理
    return Result.success(undefined);
  }

  /**
   * 削除前の機能定義存在確認
   * 削除対象が実際に存在するかを確認
   */
  async checkExistence(featureName: string): Promise<Result<boolean, Error>> {
    try {
      const nameResult = FeatureName.create(featureName);
      if (!nameResult.success) {
        return Result.failure(nameResult.error);
      }

      const existsResult = await this.featureRepository.exists(nameResult.value);
      if (!existsResult.success) {
        return Result.failure(existsResult.error);
      }

      return Result.success(existsResult.value);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`機能定義の存在確認中にエラーが発生しました: ${String(error)}`)
      );
    }
  }
}
