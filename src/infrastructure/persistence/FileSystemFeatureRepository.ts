import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Feature } from '../../domain/entities/Feature.js';
import { FeatureName } from '../../domain/valueObjects/FeatureName.js';
import { IFeatureRepository } from '../../domain/repositories/IFeatureRepository.js';
import { FeatureListItemData, OperationResultData, DeletionResultData, DesignDocumentData } from '../../domain/types.js';
import { Result, Option } from '../../shared/types/functional.js';
import { CONFIG } from '../../shared/constants/config.js';
import { MESSAGES } from '../../shared/constants/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ファイルシステムを使用した機能定義リポジトリの実装
 * JSON ファイルによる永続化を提供
 */
export class FileSystemFeatureRepository implements IFeatureRepository {
  private readonly designDocumentPath: string;

  constructor() {
    const roolPath = path.resolve(__dirname, '../../../');
    this.designDocumentPath = path.resolve(roolPath, CONFIG.PATHS.DATA_DIRECTORY, CONFIG.PATHS.DESIGN_DOCUMENT_FILE);
  }

  /**
   * 指定された機能名の機能定義を取得する
   */
  async findByName(name: FeatureName): Promise<Result<Option<Feature>, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const featureData = documentResult.value.features.find(f => f.feature.name === name.value);
      if (!featureData) {
        return Result.success(Option.none());
      }

      const featureResult = Feature.create(featureData);
      if (!featureResult.success) {
        return Result.failure(featureResult.error);
      }

      return Result.success(Option.some(featureResult.value));

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 全ての機能定義の一覧を取得する
   */
  async findAll(): Promise<Result<readonly Feature[], Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const features: Feature[] = [];
      const errors: string[] = [];

      for (const featureData of documentResult.value.features) {
        const featureResult = Feature.create(featureData);
        if (featureResult.success) {
          features.push(featureResult.value);
        } else {
          errors.push(`機能「${featureData.feature.name}」の読み込みに失敗: ${featureResult.error.message}`);
        }
      }

      if (errors.length > 0) {
        return Result.failure(new Error(errors.join(', ')));
      }

      return Result.success(features);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`全機能定義の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 機能定義の概要一覧を取得する
   */
  async getList(): Promise<Result<readonly FeatureListItemData[], Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const list: FeatureListItemData[] = documentResult.value.features.map(feature => ({
        name: feature.feature.name,
        purpose: feature.feature.purpose,
      }));

      return Result.success(list);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義一覧の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 機能定義を保存する（追加または更新）
   */
  async save(feature: Feature): Promise<Result<OperationResultData, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const document = documentResult.value;
      const existingIndex = document.features.findIndex(f => f.feature.name === feature.name.value);
      const isUpdate = existingIndex >= 0;

      // 機能定義の追加または更新
      let updatedDocument: DesignDocumentData;
      if (isUpdate) {
        const newFeatures = [...document.features];
        newFeatures[existingIndex] = feature.data;
        updatedDocument = { ...document, features: newFeatures };
      } else {
        updatedDocument = {
          ...document,
          features: [...document.features, feature.data]
        };
      }

      // 設計書の保存
      const saveResult = await this.saveDesignDocument(updatedDocument);
      if (!saveResult.success) {
        return Result.failure(saveResult.error);
      }

      return Result.success({ isUpdate });

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義の保存中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定された機能名の機能定義を削除する
   */
  async delete(name: FeatureName): Promise<Result<DeletionResultData, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const document = documentResult.value;
      const existingIndex = document.features.findIndex(f => f.feature.name === name.value);

      if (existingIndex < 0) {
        return Result.success({ found: false });
      }

      // 機能定義の削除
      const newFeatures = document.features.filter((_, index) => index !== existingIndex);
      const updatedDocument = { ...document, features: newFeatures };

      // 設計書の保存
      const saveResult = await this.saveDesignDocument(updatedDocument);
      if (!saveResult.success) {
        return Result.failure(saveResult.error);
      }

      return Result.success({ found: true });

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義の削除中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定された機能名の機能定義が存在するかチェックする
   */
  async exists(name: FeatureName): Promise<Result<boolean, Error>> {
    try {
      const findResult = await this.findByName(name);
      if (!findResult.success) {
        return Result.failure(findResult.error);
      }

      return Result.success(findResult.value.isSome);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義の存在確認中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 機能定義の総数を取得する
   */
  async count(): Promise<Result<number, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      return Result.success(documentResult.value.features.length);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義数の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 複数の機能名で機能定義を一括取得する
   */
  async findByNames(names: readonly FeatureName[]): Promise<Result<{
    readonly found: readonly Feature[];
    readonly notFound: readonly FeatureName[];
  }, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const found: Feature[] = [];
      const notFound: FeatureName[] = [];

      for (const name of names) {
        const featureData = documentResult.value.features.find(f => f.feature.name === name.value);
        if (featureData) {
          const featureResult = Feature.create(featureData);
          if (featureResult.success) {
            found.push(featureResult.value);
          } else {
            return Result.failure(featureResult.error);
          }
        } else {
          notFound.push(name);
        }
      }

      return Result.success({ found, notFound });

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能定義の一括取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 設計書をファイルから読み込む
   */
  private async loadDesignDocument(): Promise<Result<DesignDocumentData, Error>> {
    try {
      const fileContent = await fs.readFile(this.designDocumentPath, CONFIG.ENCODING.UTF8);
      const document = JSON.parse(fileContent) as DesignDocumentData;

      // データ整合性の確認
      const validatedDocument: DesignDocumentData = {
        features: Array.isArray(document.features) ? document.features : [],
        terms: Array.isArray(document.terms) ? document.terms : [],
      };

      return Result.success(validatedDocument);

    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        // ファイルが存在しない場合は空の設計書を返す
        const emptyDocument: DesignDocumentData = { features: [], terms: [] };
        return Result.success(emptyDocument);
      }

      return Result.failure(
        error instanceof Error
          ? new Error(MESSAGES.ERROR.DESIGN_LOAD_FAILED(error.message))
          : new Error(MESSAGES.ERROR.DESIGN_LOAD_FAILED(String(error)))
      );
    }
  }

  /**
   * 設計書をファイルに保存する
   */
  private async saveDesignDocument(document: DesignDocumentData): Promise<Result<void, Error>> {
    try {
      const jsonContent = JSON.stringify(document, null, 2);
      await fs.writeFile(this.designDocumentPath, jsonContent, CONFIG.ENCODING.UTF8);
      return Result.success(undefined);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? new Error(MESSAGES.ERROR.DESIGN_SAVE_FAILED(error.message))
          : new Error(MESSAGES.ERROR.DESIGN_SAVE_FAILED(String(error)))
      );
    }
  }
}
