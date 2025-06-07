import { Term } from '../../domain/entities/Term';
import { TermName } from '../../domain/valueObjects/TermName';
import { ITermRepository } from '../../domain/repositories/ITermRepository';
import { TermData, OperationResultData } from '../../domain/types';
import { Result } from '../../shared/types/functional';

/**
 * ユビキタス言語情報追加・更新ユースケース
 * ユビキタス言語情報の追加または更新に関するビジネスロジックを管理
 */
export class AddOrUpdateTermUseCase {
  constructor(
    private readonly termRepository: ITermRepository
  ) {}

  /**
   * ユビキタス言語情報を追加または更新する
   * @param termData ユビキタス言語情報データ
   * @returns 操作結果
   */
  async execute(termData: TermData): Promise<Result<OperationResultData, Error>> {
    try {
      // 1. ユビキタス言語情報エンティティの作成（バリデーション含む）
      const termResult = Term.create(termData);
      if (!termResult.success) {
        return Result.failure(termResult.error);
      }

      const term = termResult.value;

      // 2. 既存用語の存在確認
      const existsResult = await this.termRepository.exists(term.name);
      if (!existsResult.success) {
        return Result.failure(existsResult.error);
      }

      // 3. ユビキタス言語情報の保存
      const saveResult = await this.termRepository.save(term);
      if (!saveResult.success) {
        return Result.failure(saveResult.error);
      }

      // 4. 操作結果の返却
      return Result.success(saveResult.value);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`ユビキタス言語情報の追加・更新中に予期しないエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * ユビキタス言語情報データの事前検証
   * ユースケース実行前の軽量な検証
   */
  validateInput(termData: any): Result<void, Error> {
    if (!termData || typeof termData !== 'object') {
      return Result.failure(new Error('ユビキタス言語情報データが提供されていません'));
    }

    if (!termData.term || typeof termData.term !== 'object') {
      return Result.failure(new Error('用語基本情報が不正です'));
    }

    if (!termData.term.name || typeof termData.term.name !== 'string') {
      return Result.failure(new Error('用語名が不正です'));
    }

    // 用語名の形式チェック
    if (!TermName.isValid(termData.term.name)) {
      return Result.failure(new Error('用語名の形式が不正です'));
    }

    return Result.success(undefined);
  }

  /**
   * 依存関係の整合性チェック
   * 関連する機能定義の存在確認など
   */
  async validateDependencies(termData: TermData): Promise<Result<void, Error>> {
    // 将来的にFeatureRepositoryとの整合性チェックなどを実装
    // 現在は成功を返す
    return Result.success(undefined);
  }

  /**
   * ユビキタス言語情報の更新権限チェック
   * 将来的な権限管理のためのプレースホルダー
   */
  async checkUpdatePermission(termName: TermName): Promise<Result<boolean, Error>> {
    // 現在は常に更新可能として処理
    return Result.success(true);
  }
}
