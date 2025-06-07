import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemTermRepository } from '../../persistence/FileSystemTermRepository.js';
import { Term } from '../../../domain/entities/Term.js';
import { TermName } from '../../../domain/valueObjects/TermName.js';
import { TermData } from '../../../domain/types.js';

// テスト用データディレクトリ
const TEST_DATA_DIR = path.resolve(__dirname, '__temp__test_data_term');
const TEST_DESIGN_FILE = path.join(TEST_DATA_DIR, 'design.json');

// FileSystemTermRepositoryのテスト用クラス（DIでパスを注入可能にする）
class TestFileSystemTermRepository extends FileSystemTermRepository {
  private testDesignDocumentPath: string;

  constructor(designDocumentPath: string) {
    super();
    this.testDesignDocumentPath = designDocumentPath;
    // privateメンバーにアクセスするためにanyでキャスト
    (this as any).designDocumentPath = designDocumentPath;
  }
}

describe('FileSystemTermRepository', () => {
  let repository: TestFileSystemTermRepository;

  const validTermData: TermData = {
    term: {
      name: 'TestTerm',
      definition: 'テスト用語の定義',
      aliases: ['テスト語', 'Test'],
      context: {
        boundedContext: 'テストコンテキスト',
        scope: 'テスト範囲'
      }
    },
    details: {
      category: 'エンティティ',
      examples: [
        {
          scenario: 'テストシナリオ1',
          description: 'テストシナリオの説明1'
        }
      ],
      ambiguitiesAndBoundaries: ['テスト境界1', 'テスト境界2']
    },
    relationships: {
      relatedTerms: [
        {
          termName: '関連用語1',
          relationshipType: '関連関係'
        }
      ],
      associatedFunctions: ['TestFunction']
    },
    implementation: {
      codeMapping: 'TestClass',
      dataStructureHint: { type: 'object' },
      constraints: ['制約1', '制約2']
    }
  };

  beforeEach(async () => {
    // テスト用データディレクトリを作成
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    repository = new TestFileSystemTermRepository(TEST_DESIGN_FILE);
  });

  afterEach(async () => {
    // テスト用データを削除
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // 削除に失敗しても継続
    }
  });

  describe('findByName', () => {
    it('存在する用語を正常に取得できる', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [],
        terms: [validTermData]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName = TermName.create('TestTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.findByName(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isSome).toBe(true);
      if (!result.value.isSome) return;
      expect(result.value.value.name.value).toBe('TestTerm');
    });

    it('存在しない用語を検索した場合はNoneを返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName = TermName.create('NonExistentTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.findByName(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isNone).toBe(true);
    });

    it('設計書ファイルが存在しない場合は空のドキュメントとして扱う', async () => {
      const termName = TermName.create('TestTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.findByName(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isNone).toBe(true);
    });

    it('無効なJSONファイルの場合はエラーを返す', async () => {
      // 準備：無効なJSONファイルを作成
      await fs.writeFile(TEST_DESIGN_FILE, 'invalid json', 'utf8');

      const termName = TermName.create('TestTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.findByName(termName.value);

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('findAll', () => {
    it('全ての用語を正常に取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData, term: { ...validTermData.term, name: 'Term1' } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term2' } }
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findAll();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(2);
      expect(result.value[0].name.value).toBe('Term1');
      expect(result.value[1].name.value).toBe('Term2');
    });

    it('用語が存在しない場合は空配列を返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findAll();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(0);
    });

    it('無効な用語データが含まれている場合はエラーを返す', async () => {
      // 準備：無効な用語データを含むテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData },
          { term: { name: '', definition: '', aliases: [] } } // 無効データ
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findAll();

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('getList', () => {
    it('用語の概要一覧を正常に取得できる', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [],
        terms: [validTermData]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.getList();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(1);
      expect(result.value[0].name).toBe('TestTerm');
      expect(result.value[0].definition).toBe('テスト用語の定義');
      expect(result.value[0].category).toBe('エンティティ');
    });
  });

  describe('save', () => {
    it('新規用語を正常に保存できる', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const term = Term.create(validTermData);
      expect(term.success).toBe(true);
      if (!term.success) return;

      // 実行
      const result = await repository.save(term.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isUpdate).toBe(false);

      // ファイルに保存されたことを確認
      const savedData = JSON.parse(await fs.readFile(TEST_DESIGN_FILE, 'utf8'));
      expect(savedData.terms.length).toBe(1);
      expect(savedData.terms[0].term.name).toBe('TestTerm');
    });

    it('既存用語を正常に更新できる', async () => {
      // 準備：既存のテストデータを作成
      const testData = {
        features: [],
        terms: [validTermData]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const updatedTermData = {
        ...validTermData,
        term: { ...validTermData.term, definition: '更新されたテスト用語の定義' }
      };
      const term = Term.create(updatedTermData);
      expect(term.success).toBe(true);
      if (!term.success) return;

      // 実行
      const result = await repository.save(term.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isUpdate).toBe(true);

      // ファイルが更新されたことを確認
      const savedData = JSON.parse(await fs.readFile(TEST_DESIGN_FILE, 'utf8'));
      expect(savedData.terms.length).toBe(1);
      expect(savedData.terms[0].term.definition).toBe('更新されたテスト用語の定義');
    });

    it('読み取り専用ディレクトリの場合は保存エラーを返す', async () => {
      // 準備：読み取り専用のディレクトリにファイルを配置
      const readOnlyDir = path.join(TEST_DATA_DIR, 'readonly');
      await fs.mkdir(readOnlyDir, { recursive: true });
      const readOnlyFile = path.join(readOnlyDir, 'design.json');
      
      // 読み取り専用ディレクトリ用のリポジトリを作成
      const readOnlyRepository = new TestFileSystemTermRepository(readOnlyFile);
      
      const term = Term.create(validTermData);
      expect(term.success).toBe(true);
      if (!term.success) return;

      try {
        // ディレクトリを読み取り専用に設定
        await fs.chmod(readOnlyDir, 0o555);

        // 実行
        const result = await readOnlyRepository.save(term.value);

        // 検証
        expect(result.success).toBe(false);
      } finally {
        // クリーンアップ：権限を戻す
        await fs.chmod(readOnlyDir, 0o755);
      }
    });
  });

  describe('delete', () => {
    it('存在する用語を正常に削除できる', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [],
        terms: [validTermData]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName = TermName.create('TestTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.delete(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found).toBe(true);

      // ファイルから削除されたことを確認
      const savedData = JSON.parse(await fs.readFile(TEST_DESIGN_FILE, 'utf8'));
      expect(savedData.terms.length).toBe(0);
    });

    it('存在しない用語を削除しようとした場合はfound:falseを返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName = TermName.create('NonExistentTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.delete(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found).toBe(false);
    });
  });

  describe('exists', () => {
    it('存在する用語の場合はtrueを返す', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [],
        terms: [validTermData]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName = TermName.create('TestTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.exists(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(true);
    });

    it('存在しない用語の場合はfalseを返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName = TermName.create('NonExistentTerm');
      expect(termName.success).toBe(true);
      if (!termName.success) return;

      // 実行
      const result = await repository.exists(termName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(false);
    });
  });

  describe('count', () => {
    it('用語定義数を正常に取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData, term: { ...validTermData.term, name: 'Term1' } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term2' } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term3' } }
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.count();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(3);
    });

    it('用語が存在しない場合は0を返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.count();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(0);
    });
  });

  describe('findByNames', () => {
    it('指定された用語名の用語を一括取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData, term: { ...validTermData.term, name: 'Term1' } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term2' } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term3' } }
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const termName1 = TermName.create('Term1');
      const termName2 = TermName.create('Term2');
      const termName3 = TermName.create('NonExistent');
      
      expect(termName1.success).toBe(true);
      expect(termName2.success).toBe(true);
      expect(termName3.success).toBe(true);
      
      if (!termName1.success || !termName2.success || !termName3.success) return;

      const termNames = [termName1.value, termName2.value, termName3.value];

      // 実行
      const result = await repository.findByNames(termNames);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found.length).toBe(2);
      expect(result.value.notFound.length).toBe(1);
      expect(result.value.found[0].name.value).toBe('Term1');
      expect(result.value.found[1].name.value).toBe('Term2');
      expect(result.value.notFound[0].value).toBe('NonExistent');
    });

    it('空の用語名配列を指定した場合は空の結果を返す', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [],
        terms: [validTermData]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findByNames([]);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found.length).toBe(0);
      expect(result.value.notFound.length).toBe(0);
    });
  });

  describe('findByAssociatedFunction', () => {
    it('指定した機能に関連する用語を取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData, relationships: { ...validTermData.relationships, associatedFunctions: ['TestFunction'] } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term2' }, relationships: { ...validTermData.relationships, associatedFunctions: ['OtherFunction'] } }
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findByAssociatedFunction('TestFunction');

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(1);
      expect(result.value[0].name.value).toBe('TestTerm');
    });
  });

  describe('findByCategory', () => {
    it('指定したカテゴリの用語を取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData, details: { ...validTermData.details, category: 'エンティティ' } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term2' }, details: { ...validTermData.details, category: '値オブジェクト' } }
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findByCategory('エンティティ');

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(1);
      expect(result.value[0].name.value).toBe('TestTerm');
    });
  });

  describe('findByBoundedContext', () => {
    it('指定した境界づけられたコンテキストの用語を取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [],
        terms: [
          { ...validTermData, term: { ...validTermData.term, context: { ...validTermData.term.context, boundedContext: 'テストコンテキスト' } } },
          { ...validTermData, term: { ...validTermData.term, name: 'Term2', context: { ...validTermData.term.context, boundedContext: '別コンテキスト' } } }
        ]
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findByBoundedContext('テストコンテキスト');

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(1);
      expect(result.value[0].name.value).toBe('TestTerm');
    });
  });
});
