import { Result } from '../../shared/types/functional';
import { CONFIG } from '../../shared/constants/config';

/**
 * 機能名を表現する値オブジェクト
 * 機能名に関するバリデーションルールとビジネスロジックを内包
 */
export class FeatureName {
  private constructor(private readonly _value: string) {}

  /**
   * 機能名の値を取得する
   */
  get value(): string {
    return this._value;
  }

  /**
   * 機能名が等しいかどうかを判定する
   */
  equals(other: FeatureName): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現を取得する
   */
  toString(): string {
    return this._value;
  }

  /**
   * 文字列から機能名を作成する
   * バリデーションを実行し、不正な場合はエラーを返す
   */
  static create(value: string): Result<FeatureName, Error> {
    const validationErrors = this.validate(value);
    
    if (validationErrors.length > 0) {
      return Result.failure(new Error(validationErrors.join(', ')));
    }

    return Result.success(new FeatureName(value.trim()));
  }

  /**
   * 機能名のバリデーションを実行する
   */
  private static validate(value: string): string[] {
    const errors: string[] = [];

    if (typeof value !== 'string') {
      errors.push('機能名は文字列である必要があります');
      return errors;
    }

    if (!value.trim()) {
      errors.push('機能名は空文字列にできません');
    }

    if (value.trim().length < CONFIG.VALIDATION.MIN_STRING_LENGTH) {
      errors.push(`機能名は${CONFIG.VALIDATION.MIN_STRING_LENGTH}文字以上である必要があります`);
    }

    // 機能名の形式チェック（アルファベット、数字、アンダースコアのみ許可）
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value.trim())) {
      errors.push('機能名は英字で始まり、英数字とアンダースコアのみ使用可能です');
    }

    return errors;
  }

  /**
   * 機能名が有効かどうかを判定する
   */
  static isValid(value: string): boolean {
    return this.validate(value).length === 0;
  }
}
