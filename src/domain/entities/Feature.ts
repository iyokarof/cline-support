import { FeatureName } from '../valueObjects/FeatureName';
import { FeatureData, InputData, OutputData, CoreLogicStepData } from '../types';
import { Result, ValidationResult } from '../../shared/types/functional';
import { CONFIG } from '../../shared/constants/config';

/**
 * 機能定義エンティティ
 * 機能定義に関するビジネスルールとドメインロジックを内包
 */
export class Feature {
  private constructor(
    private readonly _name: FeatureName,
    private readonly _data: FeatureData
  ) {}

  /**
   * 機能名を取得する
   */
  get name(): FeatureName {
    return this._name;
  }

  /**
   * 機能データを取得する
   */
  get data(): FeatureData {
    return this._data;
  }

  /**
   * 機能の目的を取得する
   */
  get purpose(): string {
    return this._data.feature.purpose;
  }

  /**
   * ユーザーストーリーを取得する
   */
  get userStories(): readonly string[] {
    return this._data.feature.userStories;
  }

  /**
   * 入力パラメータを取得する
   */
  get inputs(): readonly InputData[] {
    return this._data.inputs;
  }

  /**
   * 出力データを取得する
   */
  get outputs(): readonly OutputData[] {
    return this._data.outputs;
  }

  /**
   * コアロジックステップを取得する
   */
  get coreLogicSteps(): readonly CoreLogicStepData[] {
    return this._data.coreLogicSteps;
  }

  /**
   * 機能が同じかどうかを判定する（機能名で判定）
   */
  equals(other: Feature): boolean {
    return this._name.equals(other._name);
  }

  /**
   * 機能定義を更新した新しいFeatureインスタンスを作成する
   * イミュータブルな設計のため、元のインスタンスは変更されない
   */
  update(newData: Partial<FeatureData>): Result<Feature, Error> {
    const updatedData: FeatureData = {
      ...this._data,
      ...newData,
      feature: {
        ...this._data.feature,
        ...(newData.feature || {}),
      },
    };

    return Feature.create(updatedData);
  }

  /**
   * 機能定義からFeatureエンティティを作成する
   */
  static create(data: FeatureData): Result<Feature, Error> {
    // 機能名の検証
    const nameResult = FeatureName.create(data.feature.name);
    if (!nameResult.success) {
      return Result.failure(nameResult.error);
    }

    // 機能定義全体の検証
    const validationResult = this.validateFeatureData(data);
    if (!validationResult.isValid) {
      return Result.failure(new Error(validationResult.errors.join(', ')));
    }

    return Result.success(new Feature(nameResult.value, data));
  }

  /**
   * 機能定義データの総合的なバリデーションを実行する
   */
  private static validateFeatureData(data: FeatureData): ValidationResult {
    const errors: string[] = [];

    // 基本情報の検証
    if (!data.feature.purpose?.trim()) {
      errors.push('機能の目的は必須です');
    }

    if (!Array.isArray(data.feature.userStories)) {
      errors.push('ユーザーストーリーは配列である必要があります');
    }

    // 配列フィールドの検証
    if (!Array.isArray(data.inputs)) {
      errors.push('入力パラメータは配列である必要があります');
    }

    if (!Array.isArray(data.outputs)) {
      errors.push('出力データは配列である必要があります');
    }

    if (!Array.isArray(data.coreLogicSteps)) {
      errors.push('コアロジックステップは配列である必要があります');
    }

    if (!Array.isArray(data.errorHandling)) {
      errors.push('エラーハンドリングは配列である必要があります');
    }

    if (!Array.isArray(data.nonFunctionalRequirements)) {
      errors.push('非機能要件は配列である必要があります');
    }

    if (!Array.isArray(data.documentationNotes)) {
      errors.push('ドキュメントノートは配列である必要があります');
    }

    // 入力パラメータの検証
    errors.push(...this.validateInputs(data.inputs));

    // 出力データの検証
    errors.push(...this.validateOutputs(data.outputs));

    // コアロジックステップの検証
    errors.push(...this.validateCoreLogicSteps(data.coreLogicSteps));

    return errors.length === 0 
      ? ValidationResult.success() 
      : ValidationResult.failure(errors);
  }

  /**
   * 入力パラメータの検証
   */
  private static validateInputs(inputs: readonly InputData[]): string[] {
    const errors: string[] = [];

    for (const [index, input] of inputs.entries()) {
      if (!input.name?.trim()) {
        errors.push(`入力パラメータ[${index}]: 名前は必須です`);
      }

      if (!input.dataTypeDescription?.trim()) {
        errors.push(`入力パラメータ[${index}]: データ型説明は必須です`);
      }

      if (!input.purpose?.trim()) {
        errors.push(`入力パラメータ[${index}]: 目的は必須です`);
      }

      if (!Array.isArray(input.constraints)) {
        errors.push(`入力パラメータ[${index}]: 制約は配列である必要があります`);
      }
    }

    return errors;
  }

  /**
   * 出力データの検証
   */
  private static validateOutputs(outputs: readonly OutputData[]): string[] {
    const errors: string[] = [];

    for (const [index, output] of outputs.entries()) {
      if (!output.condition?.trim()) {
        errors.push(`出力データ[${index}]: 条件は必須です`);
      }

      if (!output.dataDescription?.trim()) {
        errors.push(`出力データ[${index}]: データ説明は必須です`);
      }

      if (!output.structureHint || typeof output.structureHint !== 'object') {
        errors.push(`出力データ[${index}]: 構造ヒントはオブジェクトである必要があります`);
      }
    }

    return errors;
  }

  /**
   * コアロジックステップの検証
   */
  private static validateCoreLogicSteps(steps: readonly CoreLogicStepData[]): string[] {
    const errors: string[] = [];

    for (const [index, step] of steps.entries()) {
      if (typeof step.stepNumber !== 'number' || step.stepNumber < CONFIG.VALIDATION.MIN_STEP_NUMBER) {
        errors.push(`コアロジックステップ[${index}]: ステップ番号は${CONFIG.VALIDATION.MIN_STEP_NUMBER}以上の数値である必要があります`);
      }

      if (!step.description?.trim()) {
        errors.push(`コアロジックステップ[${index}]: 説明は必須です`);
      }

      if (!step.output?.trim()) {
        errors.push(`コアロジックステップ[${index}]: 出力は必須です`);
      }

      if (!Array.isArray(step.inputs)) {
        errors.push(`コアロジックステップ[${index}]: 入力は配列である必要があります`);
      }
    }

    // ステップ番号の重複チェック
    const stepNumbers = steps.map(s => s.stepNumber);
    const uniqueStepNumbers = new Set(stepNumbers);
    if (stepNumbers.length !== uniqueStepNumbers.size) {
      errors.push('コアロジックステップのステップ番号に重複があります');
    }

    return errors;
  }
}
