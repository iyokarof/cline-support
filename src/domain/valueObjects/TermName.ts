import { Result } from '../../shared/types/functional';
import { CONFIG } from '../../shared/constants/config';

/**
 * ユビキタス言語の用語名を表現する値オブジェクト
 * 用語名に関するバリデーションルールとビジネスロジックを内包
 */
export class TermName {
  private constructor(private readonly _value: string) {}

  /**
   * 用語名の値を取得する
   */
  get value(): string {
    return this._value;
  }

  /**
   * 用語名が等しいかどうかを判定する
   */
  equals(other: TermName): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現を取得する
   */
  toString(): string {
    return this._value;
  }

  /**
   * 文字列から用語名を作成する
   * バリデーションを実行し、不正な場合はエラーを返す
   */
  static create(value: string): Result<TermName, Error> {
    const validationErrors = this.validate(value);
    
    if (validationErrors.length > 0) {
      return Result.failure(new Error(validationErrors.join(', ')));
    }

    return Result.success(new TermName(value.trim()));
  }

  /**
   * 用語名のバリデーションを実行する
   */
  private static validate(value: string): string[] {
    const errors: string[] = [];

    if (typeof value !== 'string') {
      errors.push('用語名は文字列である必要があります');
      return errors;
    }

    if (!value.trim()) {
      errors.push('用語名は空文字列にできません');
    }

    if (value.trim().length < CONFIG.VALIDATION.MIN_STRING_LENGTH) {
      errors.push(`用語名は${CONFIG.VALIDATION.MIN_STRING_LENGTH}文字以上である必要があります`);
    }

    // 用語名は日本語、英字、数字、ハイフン、アンダースコアを許可
    if (!/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBFa-zA-Z0-9_\-\s]+$/.test(value.trim())) {
      errors.push('用語名は日本語、英数字、ハイフン、アンダースコア、スペースのみ使用可能です');
    }

    return errors;
  }

  /**
   * 用語名が有効かどうかを判定する
   */
  static isValid(value: string): boolean {
    return this.validate(value).length === 0;
  }
}
