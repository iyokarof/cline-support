import { TermName } from '../valueObjects/TermName.js';
import { TermData, ExampleData, RelatedTermData } from '../types.js';
import { Result, ValidationResult } from '../../shared/types/functional.js';

/**
 * ユビキタス言語情報エンティティ
 * 用語定義に関するビジネスルールとドメインロジックを内包
 */
export class Term {
  private constructor(
    private readonly _name: TermName,
    private readonly _data: TermData
  ) {}

  /**
   * 用語名を取得する
   */
  get name(): TermName {
    return this._name;
  }

  /**
   * 用語データを取得する
   */
  get data(): TermData {
    return this._data;
  }

  /**
   * 用語の定義を取得する
   */
  get definition(): string {
    return this._data.term.definition;
  }

  /**
   * 用語の別名リストを取得する
   */
  get aliases(): readonly string[] {
    return this._data.term.aliases;
  }

  /**
   * 用語のカテゴリを取得する
   */
  get category(): string {
    return this._data.details.category;
  }

  /**
   * 境界づけられたコンテキストを取得する
   */
  get boundedContext(): string {
    return this._data.term.context.boundedContext;
  }

  /**
   * 関連する機能一覧を取得する
   */
  get associatedFunctions(): readonly string[] {
    return this._data.relationships.associatedFunctions;
  }

  /**
   * 用語が同じかどうかを判定する（用語名で判定）
   */
  equals(other: Term): boolean {
    return this._name.equals(other._name);
  }

  /**
   * 指定した別名を持つかどうかを判定する
   */
  hasAlias(alias: string): boolean {
    return this._data.term.aliases.includes(alias);
  }

  /**
   * 指定した機能と関連するかどうかを判定する
   */
  isAssociatedWithFunction(functionName: string): boolean {
    return this._data.relationships.associatedFunctions.includes(functionName);
  }

  /**
   * 用語定義を更新した新しいTermインスタンスを作成する
   * イミュータブルな設計のため、元のインスタンスは変更されない
   */
  update(newData: Partial<TermData>): Result<Term, Error> {
    const updatedData: TermData = {
      ...this._data,
      ...newData,
      term: {
        ...this._data.term,
        ...(newData.term || {}),
        context: {
          ...this._data.term.context,
          ...(newData.term?.context || {}),
        },
      },
      details: {
        ...this._data.details,
        ...(newData.details || {}),
      },
      relationships: {
        ...this._data.relationships,
        ...(newData.relationships || {}),
      },
      implementation: {
        ...this._data.implementation,
        ...(newData.implementation || {}),
      },
    };

    return Term.create(updatedData);
  }

  /**
   * 用語定義からTermエンティティを作成する
   */
  static create(data: TermData): Result<Term, Error> {
    // 用語名の検証
    const nameResult = TermName.create(data.term.name);
    if (!nameResult.success) {
      return Result.failure(nameResult.error);
    }

    // 用語定義全体の検証
    const validationResult = this.validateTermData(data);
    if (!validationResult.isValid) {
      return Result.failure(new Error(validationResult.errors.join(', ')));
    }

    return Result.success(new Term(nameResult.value, data));
  }

  /**
   * 用語定義データの総合的なバリデーションを実行する
   */
  private static validateTermData(data: TermData): ValidationResult {
    const errors: string[] = [];

    // 基本情報の検証
    if (!data.term.definition?.trim()) {
      errors.push('用語の定義は必須です');
    }

    if (!Array.isArray(data.term.aliases)) {
      errors.push('別名は配列である必要があります');
    }

    // コンテキスト情報の検証
    if (!data.term.context) {
      errors.push('コンテキスト情報は必須です');
    } else {
      if (!data.term.context.boundedContext?.trim()) {
        errors.push('境界づけられたコンテキストは必須です');
      }

      if (!data.term.context.scope?.trim()) {
        errors.push('スコープは必須です');
      }
    }

    // 詳細情報の検証
    if (!data.details) {
      errors.push('詳細情報は必須です');
    } else {
      if (!data.details.category?.trim()) {
        errors.push('カテゴリは必須です');
      }

      if (!Array.isArray(data.details.examples)) {
        errors.push('使用例は配列である必要があります');
      } else {
        errors.push(...this.validateExamples(data.details.examples));
      }

      if (!Array.isArray(data.details.ambiguitiesAndBoundaries)) {
        errors.push('曖昧さと境界は配列である必要があります');
      }
    }

    // 関係性情報の検証
    if (!data.relationships) {
      errors.push('関係性情報は必須です');
    } else {
      if (!Array.isArray(data.relationships.relatedTerms)) {
        errors.push('関連用語は配列である必要があります');
      } else {
        errors.push(...this.validateRelatedTerms(data.relationships.relatedTerms));
      }

      if (!Array.isArray(data.relationships.associatedFunctions)) {
        errors.push('関連機能は配列である必要があります');
      }
    }

    // 実装情報の検証
    if (!data.implementation) {
      errors.push('実装情報は必須です');
    } else {
      if (!data.implementation.codeMapping?.trim()) {
        errors.push('コードマッピングは必須です');
      }

      if (!data.implementation.dataStructureHint || typeof data.implementation.dataStructureHint !== 'object') {
        errors.push('データ構造ヒントはオブジェクトである必要があります');
      }

      if (!Array.isArray(data.implementation.constraints)) {
        errors.push('制約は配列である必要があります');
      }
    }

    return errors.length === 0 
      ? ValidationResult.success() 
      : ValidationResult.failure(errors);
  }

  /**
   * 使用例の検証
   */
  private static validateExamples(examples: readonly ExampleData[]): string[] {
    const errors: string[] = [];

    for (const [index, example] of examples.entries()) {
      if (!example.scenario?.trim()) {
        errors.push(`使用例[${index}]: シナリオは必須です`);
      }

      if (!example.description?.trim()) {
        errors.push(`使用例[${index}]: 説明は必須です`);
      }
    }

    return errors;
  }

  /**
   * 関連用語の検証
   */
  private static validateRelatedTerms(relatedTerms: readonly RelatedTermData[]): string[] {
    const errors: string[] = [];

    for (const [index, relatedTerm] of relatedTerms.entries()) {
      if (!relatedTerm.termName?.trim()) {
        errors.push(`関連用語[${index}]: 用語名は必須です`);
      }

      if (!relatedTerm.relationshipType?.trim()) {
        errors.push(`関連用語[${index}]: 関係タイプは必須です`);
      }
    }

    return errors;
  }
}
