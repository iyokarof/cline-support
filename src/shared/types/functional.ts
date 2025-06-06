/**
 * 関数型プログラミングのパターンを提供する型定義
 */

/**
 * 成功またはエラーを表現するResult型
 * エラーハンドリングを型安全に行うための型
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly value: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Result型のコンストラクター
 */
export const Result = {
  /**
   * 成功のResultを作成する
   */
  success: <T>(value: T): Success<T> => ({
    success: true,
    value,
  }),

  /**
   * 失敗のResultを作成する
   */
  failure: <E>(error: E): Failure<E> => ({
    success: false,
    error,
  }),

  /**
   * 値がnullでない場合は成功、nullの場合は失敗のResultを作成する
   */
  fromNullable: <T>(value: T | null | undefined, error: Error): Result<T, Error> =>
    value != null ? Result.success(value) : Result.failure(error),
};

/**
 * 値の存在・非存在を表現するOption型
 */
export type Option<T> = Some<T> | None;

export interface Some<T> {
  readonly isSome: true;
  readonly isNone: false;
  readonly value: T;
}

export interface None {
  readonly isSome: false;
  readonly isNone: true;
}

/**
 * Option型のコンストラクター
 */
export const Option = {
  /**
   * 値が存在するOptionを作成する
   */
  some: <T>(value: T): Some<T> => ({
    isSome: true,
    isNone: false,
    value,
  }),

  /**
   * 値が存在しないOptionを作成する
   */
  none: (): None => ({
    isSome: false,
    isNone: true,
  }),

  /**
   * 値がnullでない場合はSome、nullの場合はNoneを作成する
   */
  fromNullable: <T>(value: T | null | undefined): Option<T> =>
    value != null ? Option.some(value) : Option.none(),
};

/**
 * バリデーション結果を表現する型
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * ValidationResultのコンストラクター
 */
export const ValidationResult = {
  /**
   * 成功のバリデーション結果を作成する
   */
  success: (): ValidationResult => ({
    isValid: true,
    errors: [],
  }),

  /**
   * 失敗のバリデーション結果を作成する
   */
  failure: (errors: readonly string[]): ValidationResult => ({
    isValid: false,
    errors,
  }),

  /**
   * 単一のエラーメッセージで失敗のバリデーション結果を作成する
   */
  singleFailure: (error: string): ValidationResult => ({
    isValid: false,
    errors: [error],
  }),
};
