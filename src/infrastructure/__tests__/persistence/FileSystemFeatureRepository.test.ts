import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemFeatureRepository } from '../../persistence/FileSystemFeatureRepository.js';
import { Feature } from '../../../domain/entities/Feature.js';
import { FeatureName } from '../../../domain/valueObjects/FeatureName.js';
import { FeatureData } from '../../../domain/types.js';

// テスト用データディレクトリ
const TEST_DATA_DIR = path.resolve(__dirname, '__temp__test_data');
const TEST_DESIGN_FILE = path.join(TEST_DATA_DIR, 'design.json');

// FileSystemFeatureRepositoryのテスト用クラス（DIでパスを注入可能にする）
class TestFileSystemFeatureRepository extends FileSystemFeatureRepository {
  private testDesignDocumentPath: string;

  constructor(designDocumentPath: string) {
    super();
    this.testDesignDocumentPath = designDocumentPath;
    // privateメンバーにアクセスするためにanyでキャスト
    (this as any).designDocumentPath = designDocumentPath;
  }
}

describe('FileSystemFeatureRepository', () => {
  let repository: TestFileSystemFeatureRepository;

  const validFeatureData: FeatureData = {
    feature: {
      name: 'TestFeature',
      purpose: 'テスト用機能',
      userStories: ['ユーザーストーリー1', 'ユーザーストーリー2']
    },
    inputs: [
      {
        name: 'testInput',
        dataTypeDescription: 'string',
        constraints: ['必須'],
        purpose: 'テスト用入力'
      }
    ],
    outputs: [
      {
        condition: '正常時',
        dataDescription: 'テスト結果',
        structureHint: { type: 'string' }
      }
    ],
    coreLogicSteps: [
      {
        stepNumber: 1,
        description: 'テスト処理',
        inputs: ['testInput'],
        output: 'testResult'
      }
    ],
    errorHandling: [
      {
        errorCondition: 'テスト例外',
        detectionPoint: 'ステップ1',
        handlingStrategyDescription: 'エラーハンドリング',
        resultingOutputCondition: 'エラー時'
      }
    ],
    nonFunctionalRequirements: [
      {
        requirement: 'パフォーマンス',
        considerationsForLogic: 'ロジック考慮事項'
      }
    ],
    documentationNotes: ['テスト用ドキュメント']
  };

  beforeEach(async () => {
    // テスト用データディレクトリを作成
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    repository = new TestFileSystemFeatureRepository(TEST_DESIGN_FILE);
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
    it('存在する機能を正常に取得できる', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [validFeatureData],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName = FeatureName.create('TestFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.findByName(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isSome).toBe(true);
      if (!result.value.isSome) return;
      expect(result.value.value.name.value).toBe('TestFeature');
    });

    it('存在しない機能を検索した場合はNoneを返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName = FeatureName.create('NonExistentFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.findByName(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isNone).toBe(true);
    });

    it('設計書ファイルが存在しない場合は空のドキュメントとして扱う', async () => {
      const featureName = FeatureName.create('TestFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.findByName(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isNone).toBe(true);
    });

    it('無効なJSONファイルの場合はエラーを返す', async () => {
      // 準備：無効なJSONファイルを作成
      await fs.writeFile(TEST_DESIGN_FILE, 'invalid json', 'utf8');

      const featureName = FeatureName.create('TestFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.findByName(featureName.value);

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('findAll', () => {
    it('全ての機能を正常に取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature1' } },
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature2' } }
        ],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findAll();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(2);
      expect(result.value[0].name.value).toBe('Feature1');
      expect(result.value[1].name.value).toBe('Feature2');
    });

    it('機能が存在しない場合は空配列を返す', async () => {
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

    it('無効な機能データが含まれている場合はエラーを返す', async () => {
      // 準備：無効な機能データを含むテストデータを作成
      const testData = {
        features: [
          { ...validFeatureData },
          { feature: { name: '', purpose: '', userStories: [] } } // 無効データ
        ],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.findAll();

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('getList', () => {
    it('機能の概要一覧を正常に取得できる', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [validFeatureData],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.getList();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.length).toBe(1);
      expect(result.value[0].name).toBe('TestFeature');
      expect(result.value[0].purpose).toBe('テスト用機能');
    });
  });

  describe('save', () => {
    it('新規機能を正常に保存できる', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const feature = Feature.create(validFeatureData);
      expect(feature.success).toBe(true);
      if (!feature.success) return;

      // 実行
      const result = await repository.save(feature.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isUpdate).toBe(false);

      // ファイルに保存されたことを確認
      const savedData = JSON.parse(await fs.readFile(TEST_DESIGN_FILE, 'utf8'));
      expect(savedData.features.length).toBe(1);
      expect(savedData.features[0].feature.name).toBe('TestFeature');
    });

    it('既存機能を正常に更新できる', async () => {
      // 準備：既存のテストデータを作成
      const testData = {
        features: [validFeatureData],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const updatedFeatureData = {
        ...validFeatureData,
        feature: { ...validFeatureData.feature, purpose: '更新されたテスト用機能' }
      };
      const feature = Feature.create(updatedFeatureData);
      expect(feature.success).toBe(true);
      if (!feature.success) return;

      // 実行
      const result = await repository.save(feature.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.isUpdate).toBe(true);

      // ファイルが更新されたことを確認
      const savedData = JSON.parse(await fs.readFile(TEST_DESIGN_FILE, 'utf8'));
      expect(savedData.features.length).toBe(1);
      expect(savedData.features[0].feature.purpose).toBe('更新されたテスト用機能');
    });

    it('読み取り専用ディレクトリの場合は保存エラーを返す', async () => {
      // 準備：読み取り専用のディレクトリにファイルを配置
      const readOnlyDir = path.join(TEST_DATA_DIR, 'readonly');
      await fs.mkdir(readOnlyDir, { recursive: true });
      const readOnlyFile = path.join(readOnlyDir, 'design.json');
      
      // 読み取り専用ディレクトリ用のリポジトリを作成
      const readOnlyRepository = new TestFileSystemFeatureRepository(readOnlyFile);
      
      const feature = Feature.create(validFeatureData);
      expect(feature.success).toBe(true);
      if (!feature.success) return;

      try {
        // ディレクトリを読み取り専用に設定
        await fs.chmod(readOnlyDir, 0o555);

        // 実行
        const result = await readOnlyRepository.save(feature.value);

        // 検証
        expect(result.success).toBe(false);
      } finally {
        // クリーンアップ：権限を戻す
        await fs.chmod(readOnlyDir, 0o755);
      }
    });
  });

  describe('delete', () => {
    it('存在する機能を正常に削除できる', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [validFeatureData],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName = FeatureName.create('TestFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.delete(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found).toBe(true);

      // ファイルから削除されたことを確認
      const savedData = JSON.parse(await fs.readFile(TEST_DESIGN_FILE, 'utf8'));
      expect(savedData.features.length).toBe(0);
    });

    it('存在しない機能を削除しようとした場合はfound:falseを返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName = FeatureName.create('NonExistentFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.delete(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found).toBe(false);
    });
  });

  describe('exists', () => {
    it('存在する機能の場合はtrueを返す', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [validFeatureData],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName = FeatureName.create('TestFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.exists(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(true);
    });

    it('存在しない機能の場合はfalseを返す', async () => {
      // 準備：空のテストデータを作成
      const testData = {
        features: [],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName = FeatureName.create('NonExistentFeature');
      expect(featureName.success).toBe(true);
      if (!featureName.success) return;

      // 実行
      const result = await repository.exists(featureName.value);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(false);
    });
  });

  describe('count', () => {
    it('機能定義数を正常に取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature1' } },
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature2' } },
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature3' } }
        ],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      // 実行
      const result = await repository.count();

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(3);
    });

    it('機能が存在しない場合は0を返す', async () => {
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
    it('指定された機能名の機能を一括取得できる', async () => {
      // 準備：複数のテストデータを作成
      const testData = {
        features: [
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature1' } },
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature2' } },
          { ...validFeatureData, feature: { ...validFeatureData.feature, name: 'Feature3' } }
        ],
        terms: []
      };
      await fs.writeFile(TEST_DESIGN_FILE, JSON.stringify(testData), 'utf8');

      const featureName1 = FeatureName.create('Feature1');
      const featureName2 = FeatureName.create('Feature2');
      const featureName3 = FeatureName.create('NonExistent');
      
      expect(featureName1.success).toBe(true);
      expect(featureName2.success).toBe(true);
      expect(featureName3.success).toBe(true);
      
      if (!featureName1.success || !featureName2.success || !featureName3.success) return;

      const featureNames = [featureName1.value, featureName2.value, featureName3.value];

      // 実行
      const result = await repository.findByNames(featureNames);

      // 検証
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value.found.length).toBe(2);
      expect(result.value.notFound.length).toBe(1);
      expect(result.value.found[0].name.value).toBe('Feature1');
      expect(result.value.found[1].name.value).toBe('Feature2');
      expect(result.value.notFound[0].value).toBe('NonExistent');
    });

    it('空の機能名配列を指定した場合は空の結果を返す', async () => {
      // 準備：テストデータを作成
      const testData = {
        features: [validFeatureData],
        terms: []
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
});
