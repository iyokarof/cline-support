import { Term } from '../entities/Term';
import { TermName } from '../valueObjects/TermName';
import { TermListItemData, OperationResultData, DeletionResultData } from '../types';
import { Result, Option } from '../../shared/types/functional';

/**
 * ユビキタス言語情報リポジトリのインターフェース
 * データの永続化に関するドメインの要求を定義
 */
export interface ITermRepository {
  /**
   * 指定された用語名のユビキタス言語情報を取得する
   * @param name 用語名
   * @returns ユビキタス言語情報（見つからない場合はNone）
   */
  findByName(name: TermName): Promise<Result<Option<Term>, Error>>;

  /**
   * 全てのユビキタス言語情報の一覧を取得する
   * @returns ユビキタス言語情報一覧
   */
  findAll(): Promise<Result<readonly Term[], Error>>;

  /**
   * ユビキタス言語情報の概要一覧を取得する
   * @returns ユビキタス言語情報の概要一覧
   */
  getList(): Promise<Result<readonly TermListItemData[], Error>>;

  /**
   * ユビキタス言語情報を保存する（追加または更新）
   * @param term 保存するユビキタス言語情報
   * @returns 操作結果（追加の場合false、更新の場合true）
   */
  save(term: Term): Promise<Result<OperationResultData, Error>>;

  /**
   * 指定された用語名のユビキタス言語情報を削除する
   * @param name 削除する用語名
   * @returns 削除結果（見つかった場合true、見つからない場合false）
   */
  delete(name: TermName): Promise<Result<DeletionResultData, Error>>;

  /**
   * 指定された用語名のユビキタス言語情報が存在するかチェックする
   * @param name 用語名
   * @returns 存在する場合true
   */
  exists(name: TermName): Promise<Result<boolean, Error>>;

  /**
   * ユビキタス言語情報の総数を取得する
   * @returns ユビキタス言語情報の総数
   */
  count(): Promise<Result<number, Error>>;

  /**
   * 複数の用語名でユビキタス言語情報を一括取得する
   * @param names 用語名の配列
   * @returns 見つかったユビキタス言語情報の配列と見つからなかった用語名の配列
   */
  findByNames(names: readonly TermName[]): Promise<Result<{
    readonly found: readonly Term[];
    readonly notFound: readonly TermName[];
  }, Error>>;

  /**
   * 指定した機能に関連するユビキタス言語情報を取得する
   * @param functionName 機能名
   * @returns 関連するユビキタス言語情報の配列
   */
  findByAssociatedFunction(functionName: string): Promise<Result<readonly Term[], Error>>;

  /**
   * 指定したカテゴリのユビキタス言語情報を取得する
   * @param category カテゴリ名
   * @returns 該当するユビキタス言語情報の配列
   */
  findByCategory(category: string): Promise<Result<readonly Term[], Error>>;

  /**
   * 指定した境界づけられたコンテキストのユビキタス言語情報を取得する
   * @param boundedContext 境界づけられたコンテキスト
   * @returns 該当するユビキタス言語情報の配列
   */
  findByBoundedContext(boundedContext: string): Promise<Result<readonly Term[], Error>>;
}
