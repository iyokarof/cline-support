import { FeatureName } from '../../domain/valueObjects/FeatureName.js';
import { TermName } from '../../domain/valueObjects/TermName.js';
import { IFeatureRepository } from '../../domain/repositories/IFeatureRepository.js';
import { ITermRepository } from '../../domain/repositories/ITermRepository.js';
import { DetailsResponseData } from '../../domain/types.js';
import { Result } from '../../shared/types/functional.js';

/**
 * 詳細取得ユースケース
 * 機能定義とユビキタス言語情報の詳細を一括取得するビジネスロジックを管理
 */
export class GetDetailsUseCase {
  constructor(
    private readonly featureRepository: IFeatureRepository,
    private readonly termRepository: ITermRepository
  ) {}

  /**
   * 指定された機能定義とユビキタス言語情報の詳細を取得する
   * @param featureNames 機能名の配列（省略可能）
   * @param termNames 用語名の配列（省略可能）
   * @returns 詳細情報
   */
  async execute(
    featureNames?: readonly string[], 
    termNames?: readonly string[]
  ): Promise<Result<DetailsResponseData, Error>> {
    try {
      // 1. 機能定義の取得
      const featuresResult = await this.getFeatures(featureNames);
      if (!featuresResult.success) {
        return Result.failure(featuresResult.error);
      }

      // 2. ユビキタス言語情報の取得
      const termsResult = await this.getTerms(termNames);
      if (!termsResult.success) {
        return Result.failure(termsResult.error);
      }

      // 3. 結果の組み立て
      const response: DetailsResponseData = {
        features: featuresResult.value.found.map(f => f.data),
        terms: termsResult.value.found.map(t => t.data),
        notFound: {
          featureNames: featuresResult.value.notFound.map(name => name.value),
          termNames: termsResult.value.notFound.map(name => name.value),
        },
      };

      return Result.success(response);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`詳細情報の取得中に予期しないエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 機能定義を取得する
   */
  private async getFeatures(featureNames?: readonly string[]) {
    if (!featureNames || featureNames.length === 0) {
      // 機能名が指定されていない場合は空の結果を返す
      return Result.success({
        found: [],
        notFound: [],
      });
    }

    // 文字列から値オブジェクトに変換
    const nameResults = featureNames.map(name => FeatureName.create(name));
    const invalidNames = nameResults
      .filter(result => !result.success)
      .map(result => result as any); // 型の問題を一時的に回避

    if (invalidNames.length > 0) {
      return Result.failure(new Error(`不正な機能名が含まれています: ${invalidNames.map(r => r.error.message).join(', ')}`));
    }

    const validNames = nameResults
      .filter(result => result.success)
      .map(result => (result as any).value); // 型の問題を一時的に回避

    return await this.featureRepository.findByNames(validNames);
  }

  /**
   * ユビキタス言語情報を取得する
   */
  private async getTerms(termNames?: readonly string[]) {
    if (!termNames || termNames.length === 0) {
      // 用語名が指定されていない場合は空の結果を返す
      return Result.success({
        found: [],
        notFound: [],
      });
    }

    // 文字列から値オブジェクトに変換
    const nameResults = termNames.map(name => TermName.create(name));
    const invalidNames = nameResults
      .filter(result => !result.success)
      .map(result => result as any); // 型の問題を一時的に回避

    if (invalidNames.length > 0) {
      return Result.failure(new Error(`不正な用語名が含まれています: ${invalidNames.map(r => r.error.message).join(', ')}`));
    }

    const validNames = nameResults
      .filter(result => result.success)
      .map(result => (result as any).value); // 型の問題を一時的に回避

    return await this.termRepository.findByNames(validNames);
  }

  /**
   * 入力パラメータの事前検証
   */
  validateInput(featureNames?: any, termNames?: any): Result<void, Error> {
    // 機能名の検証
    if (featureNames !== undefined) {
      if (!Array.isArray(featureNames)) {
        return Result.failure(new Error('機能名は配列である必要があります'));
      }

      for (const name of featureNames) {
        if (typeof name !== 'string') {
          return Result.failure(new Error('機能名は文字列である必要があります'));
        }

        if (!FeatureName.isValid(name)) {
          return Result.failure(new Error(`不正な機能名: ${name}`));
        }
      }
    }

    // 用語名の検証
    if (termNames !== undefined) {
      if (!Array.isArray(termNames)) {
        return Result.failure(new Error('用語名は配列である必要があります'));
      }

      for (const name of termNames) {
        if (typeof name !== 'string') {
          return Result.failure(new Error('用語名は文字列である必要があります'));
        }

        if (!TermName.isValid(name)) {
          return Result.failure(new Error(`不正な用語名: ${name}`));
        }
      }
    }

    return Result.success(undefined);
  }

  /**
   * 全ての機能定義を取得する
   */
  async getAllFeatures(): Promise<Result<DetailsResponseData, Error>> {
    try {
      const featuresResult = await this.featureRepository.findAll();
      if (!featuresResult.success) {
        return Result.failure(featuresResult.error);
      }

      const response: DetailsResponseData = {
        features: featuresResult.value.map(f => f.data),
        terms: [],
        notFound: {
          featureNames: [],
          termNames: [],
        },
      };

      return Result.success(response);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`全機能定義の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 全てのユビキタス言語情報を取得する
   */
  async getAllTerms(): Promise<Result<DetailsResponseData, Error>> {
    try {
      const termsResult = await this.termRepository.findAll();
      if (!termsResult.success) {
        return Result.failure(termsResult.error);
      }

      const response: DetailsResponseData = {
        features: [],
        terms: termsResult.value.map(t => t.data),
        notFound: {
          featureNames: [],
          termNames: [],
        },
      };

      return Result.success(response);

    } catch (error) {
      return Result.failure(
        error instanceof Error 
          ? error 
          : new Error(`全ユビキタス言語情報の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }
}
