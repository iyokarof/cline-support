import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DesignDocument, Feature, Term, FeatureListItem, TermListItem, DetailsResponse } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 設計書データの管理を行うクラス
 */
export class DataManager {
  private designDocumentPath: string;
  private designDocument: DesignDocument;

  constructor() {
    // データファイルのパスを設定（srcから../data/design.jsonへの相対パス）
    this.designDocumentPath = path.resolve(__dirname, '../data/design.json');
    this.designDocument = { features: [], terms: [] };
  }

  /**
   * 初期化処理：design.jsonファイルを読み込む
   */
  async initialize(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.designDocumentPath, 'utf-8');
      this.designDocument = JSON.parse(fileContent) as DesignDocument;
      
      // データ整合性の確認
      if (!this.designDocument.features) {
        this.designDocument.features = [];
      }
      if (!this.designDocument.terms) {
        this.designDocument.terms = [];
      }
      
      console.error(`設計書を読み込みました: 機能定義 ${this.designDocument.features.length}件, 用語 ${this.designDocument.terms.length}件`);
    } catch (error) {
      console.error('設計書ファイルの読み込みに失敗しました:', error);
      // ファイルが存在しない場合は空の設計書で初期化
      this.designDocument = { features: [], terms: [] };
      await this.saveDesignDocument();
    }
  }

  /**
   * 設計書をファイルに保存する
   */
  private async saveDesignDocument(): Promise<void> {
    try {
      const jsonContent = JSON.stringify(this.designDocument, null, 2);
      await fs.writeFile(this.designDocumentPath, jsonContent, 'utf-8');
    } catch (error) {
      throw new Error(`設計書の保存に失敗しました: ${error}`);
    }
  }

  /**
   * 機能定義一覧を取得する
   */
  getFeatureList(): FeatureListItem[] {
    return this.designDocument.features.map(feature => ({
      name: feature.feature.name,
      purpose: feature.feature.purpose
    }));
  }

  /**
   * ユビキタス言語情報一覧を取得する
   */
  getTermList(): TermListItem[] {
    return this.designDocument.terms.map(term => ({
      name: term.term.name,
      definition: term.term.definition,
      category: term.details.category
    }));
  }

  /**
   * 指定された機能定義と用語の詳細を取得する
   */
  getDetails(featureNames?: string[], termNames?: string[]): DetailsResponse {
    const result: DetailsResponse = {
      features: [],
      terms: [],
      notFound: {
        featureNames: [],
        termNames: []
      }
    };

    // 機能定義を取得
    if (featureNames && featureNames.length > 0) {
      for (const featureName of featureNames) {
        const feature = this.designDocument.features.find(f => f.feature.name === featureName);
        if (feature) {
          result.features.push(feature);
        } else {
          result.notFound.featureNames.push(featureName);
        }
      }
    }

    // ユビキタス言語情報を取得
    if (termNames && termNames.length > 0) {
      for (const termName of termNames) {
        const term = this.designDocument.terms.find(t => t.term.name === termName);
        if (term) {
          result.terms.push(term);
        } else {
          result.notFound.termNames.push(termName);
        }
      }
    }

    return result;
  }

  /**
   * 機能定義を追加または更新する
   */
  async addOrUpdateFeature(feature: Feature): Promise<{ isUpdate: boolean }> {
    const existingIndex = this.designDocument.features.findIndex(
      f => f.feature.name === feature.feature.name
    );

    let isUpdate = false;
    
    if (existingIndex >= 0) {
      // 既存の機能定義を更新
      this.designDocument.features[existingIndex] = feature;
      isUpdate = true;
    } else {
      // 新しい機能定義を追加
      this.designDocument.features.push(feature);
    }

    await this.saveDesignDocument();
    return { isUpdate };
  }

  /**
   * 機能定義を削除する
   */
  async deleteFeature(featureName: string): Promise<{ found: boolean }> {
    const existingIndex = this.designDocument.features.findIndex(
      f => f.feature.name === featureName
    );

    if (existingIndex >= 0) {
      this.designDocument.features.splice(existingIndex, 1);
      await this.saveDesignDocument();
      return { found: true };
    }

    return { found: false };
  }

  /**
   * ユビキタス言語情報を追加または更新する
   */
  async addOrUpdateTerm(term: Term): Promise<{ isUpdate: boolean }> {
    const existingIndex = this.designDocument.terms.findIndex(
      t => t.term.name === term.term.name
    );

    let isUpdate = false;
    
    if (existingIndex >= 0) {
      // 既存の用語を更新
      this.designDocument.terms[existingIndex] = term;
      isUpdate = true;
    } else {
      // 新しい用語を追加
      this.designDocument.terms.push(term);
    }

    await this.saveDesignDocument();
    return { isUpdate };
  }

  /**
   * ユビキタス言語情報を削除する
   */
  async deleteTerm(termName: string): Promise<{ found: boolean }> {
    const existingIndex = this.designDocument.terms.findIndex(
      t => t.term.name === termName
    );

    if (existingIndex >= 0) {
      this.designDocument.terms.splice(existingIndex, 1);
      await this.saveDesignDocument();
      return { found: true };
    }

    return { found: false };
  }

  /**
   * 機能定義が存在するかチェックする
   */
  hasFeature(featureName: string): boolean {
    return this.designDocument.features.some(f => f.feature.name === featureName);
  }

  /**
   * ユビキタス言語情報が存在するかチェックする
   */
  hasTerm(termName: string): boolean {
    return this.designDocument.terms.some(t => t.term.name === termName);
  }

  /**
   * 設計書の統計情報を取得する
   */
  getStatistics(): { featureCount: number; termCount: number } {
    return {
      featureCount: this.designDocument.features.length,
      termCount: this.designDocument.terms.length
    };
  }
}
