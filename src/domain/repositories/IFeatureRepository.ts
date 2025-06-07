import { Feature } from '../entities/Feature';
import { FeatureName } from '../valueObjects/FeatureName';
import { FeatureListItemData, OperationResultData, DeletionResultData } from '../types';
import { Result, Option } from '../../shared/types/functional';

/**
 * 機能定義リポジトリのインターフェース
 * データの永続化に関するドメインの要求を定義
 */
export interface IFeatureRepository {
  /**
   * 指定された機能名の機能定義を取得する
   * @param name 機能名
   * @returns 機能定義（見つからない場合はNone）
   */
  findByName(name: FeatureName): Promise<Result<Option<Feature>, Error>>;

  /**
   * 全ての機能定義の一覧を取得する
   * @returns 機能定義一覧
   */
  findAll(): Promise<Result<readonly Feature[], Error>>;

  /**
   * 機能定義の概要一覧を取得する
   * @returns 機能定義の概要一覧
   */
  getList(): Promise<Result<readonly FeatureListItemData[], Error>>;

  /**
   * 機能定義を保存する（追加または更新）
   * @param feature 保存する機能定義
   * @returns 操作結果（追加の場合false、更新の場合true）
   */
  save(feature: Feature): Promise<Result<OperationResultData, Error>>;

  /**
   * 指定された機能名の機能定義を削除する
   * @param name 削除する機能名
   * @returns 削除結果（見つかった場合true、見つからない場合false）
   */
  delete(name: FeatureName): Promise<Result<DeletionResultData, Error>>;

  /**
   * 指定された機能名の機能定義が存在するかチェックする
   * @param name 機能名
   * @returns 存在する場合true
   */
  exists(name: FeatureName): Promise<Result<boolean, Error>>;

  /**
   * 機能定義の総数を取得する
   * @returns 機能定義の総数
   */
  count(): Promise<Result<number, Error>>;

  /**
   * 複数の機能名で機能定義を一括取得する
   * @param names 機能名の配列
   * @returns 見つかった機能定義の配列と見つからなかった機能名の配列
   */
  findByNames(names: readonly FeatureName[]): Promise<Result<{
    readonly found: readonly Feature[];
    readonly notFound: readonly FeatureName[];
  }, Error>>;
}
