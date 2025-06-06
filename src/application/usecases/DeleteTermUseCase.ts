import { TermName } from '../../domain/valueObjects/TermName.js';
import { ITermRepository } from '../../domain/repositories/ITermRepository.js';
import { DeletionResultData } from '../../domain/types.js';
import { Result } from '../../shared/types/functional.js';

/**
 * ユビキタス言語情報削除ユースケース
 * ユビキタス言語情報の削除に関するビジネスロジックを管理
 */
export class DeleteTermUseCase {
  constructor(
    private readonly termRepository: ITermRepository
  ) {}

  /**
   * ユビキタス言語情報を削除する
   * @param termName 削除する用語名
   * @returns 削除結果
   */
  async execute(termName: string): Promise<Result<DeletionResultData, Error>> {
    try {
      // 1. 用語名の検証とValueObjectの作成
      const nameResult = TermName.create(termName);
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
        return Result.failure(new Error('ユビキタス言語情報を削除する権限がありません'));
      }

      // 3. 依存関係のチェック
      const dependencyResult = await this.checkDependencies(name);
      if (!dependencyResult.success) {
        return Result.failure(dependencyResult.error);
      }

      // 4. ユビキタス言語情報の削除
      const deleteResult = await this.termRepository.delete(name);
      if (!deleteResult.success) {
        return Result.failure(deleteResult.error);
      }

      // 5. 削除結果の返却
      return Result.success(deleteResult.value);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`ユビキタス言語情報の削除中に予期しないエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 用語名の事前検証
   * ユースケース実行前の軽量な検証
   */
  validateInput(termName: any): Result<void, Error> {
    if (!termName || typeof termName !== 'string') {
      return Result.failure(new Error('用語名が提供されていません'));
    }

    if (!termName.trim()) {
      return Result.failure(new Error('用語名は空文字列にできません'));
    }

    // 用語名の形式チェック
    if (!TermName.isValid(termName)) {
      return Result.failure(new Error('用語名の形式が不正です'));
    }

    return Result.success(undefined);
  }

  /**
   * 削除権限の確認
   * 将来的な権限管理のためのプレースホルダー
   */
  private async checkDeletePermission(termName: TermName): Promise<Result<boolean, Error>> {
    // 現在は常に削除可能として処理
    // 将来的には以下のような権限チェックを実装
    // - ユーザーの権限レベル確認
    // - 用語の重要度による削除制限
    // - システム用語の削除禁止
    return Result.success(true);
  }

  /**
   * 依存関係のチェック
   * 削除対象のユビキタス言語情報が他の機能や用語から参照されていないかを確認
   */
  private async checkDependencies(termName: TermName): Promise<Result<void, Error>> {
    // 将来的に以下のような依存関係チェックを実装
    // - 機能定義からの参照確認
    // - 他のユビキタス言語情報からの参照確認
    // - 実装されたコードからの参照確認
    
    // 現在は依存関係の問題なしとして処理
    return Result.success(undefined);
  }

  /**
   * 削除前のユビキタス言語情報存在確認
   * 削除対象が実際に存在するかを確認
   */
  async checkExistence(termName: string): Promise<Result<boolean, Error>> {
    try {
      const nameResult = TermName.create(termName);
      if (!nameResult.success) {
        return Result.failure(nameResult.error);
      }

      const existsResult = await this.termRepository.exists(nameResult.value);
      if (!existsResult.success) {
        return Result.failure(existsResult.error);
      }

      return Result.success(existsResult.value);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`ユビキタス言語情報の存在確認中にエラーが発生しました: ${String(error)}`)
      );
    }
  }
}
