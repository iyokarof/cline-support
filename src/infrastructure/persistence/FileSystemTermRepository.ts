import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Term } from '../../domain/entities/Term.js';
import { TermName } from '../../domain/valueObjects/TermName.js';
import { ITermRepository } from '../../domain/repositories/ITermRepository.js';
import { TermListItemData, OperationResultData, DeletionResultData, DesignDocumentData } from '../../domain/types.js';
import { Result, Option } from '../../shared/types/functional.js';
import { CONFIG } from '../../shared/constants/config.js';
import { MESSAGES } from '../../shared/constants/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ファイルシステムを使用したユビキタス言語情報リポジトリの実装
 * JSON ファイルによる永続化を提供
 */
export class FileSystemTermRepository implements ITermRepository {
  private readonly designDocumentPath: string;

  constructor() {
    const roolPath = path.resolve(__dirname, '../../../');
    this.designDocumentPath = path.resolve(roolPath, CONFIG.PATHS.DATA_DIRECTORY, CONFIG.PATHS.DESIGN_DOCUMENT_FILE);
  }

  /**
   * 指定された用語名のユビキタス言語情報を取得する
   */
  async findByName(name: TermName): Promise<Result<Option<Term>, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const termData = documentResult.value.terms.find(t => t.term.name === name.value);
      if (!termData) {
        return Result.success(Option.none());
      }

      const termResult = Term.create(termData);
      if (!termResult.success) {
        return Result.failure(termResult.error);
      }

      return Result.success(Option.some(termResult.value));

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`ユビキタス言語情報の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 全てのユビキタス言語情報の一覧を取得する
   */
  async findAll(): Promise<Result<readonly Term[], Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const terms: Term[] = [];
      const errors: string[] = [];

      for (const termData of documentResult.value.terms) {
        const termResult = Term.create(termData);
        if (termResult.success) {
          terms.push(termResult.value);
        } else {
          errors.push(`用語「${termData.term.name}」の読み込みに失敗: ${termResult.error.message}`);
        }
      }

      if (errors.length > 0) {
        return Result.failure(new Error(errors.join(', ')));
      }

      return Result.success(terms);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`全ユビキタス言語情報の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * ユビキタス言語情報の概要一覧を取得する
   */
  async getList(): Promise<Result<readonly TermListItemData[], Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const list: TermListItemData[] = documentResult.value.terms.map(term => ({
        name: term.term.name,
        definition: term.term.definition,
        category: term.details.category,
      }));

      return Result.success(list);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`ユビキタス言語情報一覧の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * ユビキタス言語情報を保存する（追加または更新）
   */
  async save(term: Term): Promise<Result<OperationResultData, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const document = documentResult.value;
      const existingIndex = document.terms.findIndex(t => t.term.name === term.name.value);
      const isUpdate = existingIndex >= 0;

      // ユビキタス言語情報の追加または更新
      let updatedDocument: DesignDocumentData;
      if (isUpdate) {
        const newTerms = [...document.terms];
        newTerms[existingIndex] = term.data;
        updatedDocument = { ...document, terms: newTerms };
      } else {
        updatedDocument = {
          ...document,
          terms: [...document.terms, term.data]
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
          : new Error(`ユビキタス言語情報の保存中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定された用語名のユビキタス言語情報を削除する
   */
  async delete(name: TermName): Promise<Result<DeletionResultData, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const document = documentResult.value;
      const existingIndex = document.terms.findIndex(t => t.term.name === name.value);

      if (existingIndex < 0) {
        return Result.success({ found: false });
      }

      // ユビキタス言語情報の削除
      const newTerms = document.terms.filter((_, index) => index !== existingIndex);
      const updatedDocument = { ...document, terms: newTerms };

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
          : new Error(`ユビキタス言語情報の削除中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定された用語名のユビキタス言語情報が存在するかチェックする
   */
  async exists(name: TermName): Promise<Result<boolean, Error>> {
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
          : new Error(`ユビキタス言語情報の存在確認中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * ユビキタス言語情報の総数を取得する
   */
  async count(): Promise<Result<number, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      return Result.success(documentResult.value.terms.length);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`ユビキタス言語情報数の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 複数の用語名でユビキタス言語情報を一括取得する
   */
  async findByNames(names: readonly TermName[]): Promise<Result<{
    readonly found: readonly Term[];
    readonly notFound: readonly TermName[];
  }, Error>> {
    try {
      const documentResult = await this.loadDesignDocument();
      if (!documentResult.success) {
        return Result.failure(documentResult.error);
      }

      const found: Term[] = [];
      const notFound: TermName[] = [];

      for (const name of names) {
        const termData = documentResult.value.terms.find(t => t.term.name === name.value);
        if (termData) {
          const termResult = Term.create(termData);
          if (termResult.success) {
            found.push(termResult.value);
          } else {
            return Result.failure(termResult.error);
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
          : new Error(`ユビキタス言語情報の一括取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定した機能に関連するユビキタス言語情報を取得する
   */
  async findByAssociatedFunction(functionName: string): Promise<Result<readonly Term[], Error>> {
    try {
      const allTermsResult = await this.findAll();
      if (!allTermsResult.success) {
        return Result.failure(allTermsResult.error);
      }

      const relatedTerms = allTermsResult.value.filter(term =>
        term.isAssociatedWithFunction(functionName)
      );

      return Result.success(relatedTerms);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`機能関連ユビキタス言語情報の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定したカテゴリのユビキタス言語情報を取得する
   */
  async findByCategory(category: string): Promise<Result<readonly Term[], Error>> {
    try {
      const allTermsResult = await this.findAll();
      if (!allTermsResult.success) {
        return Result.failure(allTermsResult.error);
      }

      const categoryTerms = allTermsResult.value.filter(term =>
        term.category === category
      );

      return Result.success(categoryTerms);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`カテゴリ別ユビキタス言語情報の取得中にエラーが発生しました: ${String(error)}`)
      );
    }
  }

  /**
   * 指定した境界づけられたコンテキストのユビキタス言語情報を取得する
   */
  async findByBoundedContext(boundedContext: string): Promise<Result<readonly Term[], Error>> {
    try {
      const allTermsResult = await this.findAll();
      if (!allTermsResult.success) {
        return Result.failure(allTermsResult.error);
      }

      const contextTerms = allTermsResult.value.filter(term =>
        term.boundedContext === boundedContext
      );

      return Result.success(contextTerms);

    } catch (error) {
      return Result.failure(
        error instanceof Error
          ? error
          : new Error(`境界づけられたコンテキスト別ユビキタス言語情報の取得中にエラーが発生しました: ${String(error)}`)
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
