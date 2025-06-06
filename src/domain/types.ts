/**
 * ドメイン層の型定義
 * イミュータブルな設計を採用し、全てのプロパティをreadonlyに設定
 */

/**
 * 機能定義エンティティの型
 */
export interface FeatureData {
  readonly feature: {
    readonly name: string;
    readonly purpose: string;
    readonly userStories: readonly string[];
  };
  readonly inputs: readonly InputData[];
  readonly outputs: readonly OutputData[];
  readonly coreLogicSteps: readonly CoreLogicStepData[];
  readonly errorHandling: readonly ErrorHandlingData[];
  readonly nonFunctionalRequirements: readonly NonFunctionalRequirementData[];
  readonly documentationNotes: readonly string[];
}

/**
 * 入力パラメータの型
 */
export interface InputData {
  readonly name: string;
  readonly dataTypeDescription: string;
  readonly constraints: readonly string[];
  readonly purpose: string;
}

/**
 * 出力データの型
 */
export interface OutputData {
  readonly condition: string;
  readonly dataDescription: string;
  readonly structureHint: Readonly<Record<string, any>>;
}

/**
 * コアロジックステップの型
 */
export interface CoreLogicStepData {
  readonly stepNumber: number;
  readonly description: string;
  readonly inputs: readonly string[];
  readonly output: string;
}

/**
 * エラーハンドリングの型
 */
export interface ErrorHandlingData {
  readonly errorCondition: string;
  readonly detectionPoint: string;
  readonly handlingStrategyDescription: string;
  readonly resultingOutputCondition: string;
}

/**
 * 非機能要件の型
 */
export interface NonFunctionalRequirementData {
  readonly requirement: string;
  readonly considerationsForLogic: string;
}

/**
 * ユビキタス言語情報エンティティの型
 */
export interface TermData {
  readonly term: {
    readonly name: string;
    readonly definition: string;
    readonly aliases: readonly string[];
    readonly context: {
      readonly boundedContext: string;
      readonly scope: string;
    };
  };
  readonly details: {
    readonly category: string;
    readonly examples: readonly ExampleData[];
    readonly ambiguitiesAndBoundaries: readonly string[];
  };
  readonly relationships: {
    readonly relatedTerms: readonly RelatedTermData[];
    readonly associatedFunctions: readonly string[];
  };
  readonly implementation: {
    readonly codeMapping: string;
    readonly dataStructureHint: Readonly<Record<string, any>>;
    readonly constraints: readonly string[];
  };
}

/**
 * 用例データの型
 */
export interface ExampleData {
  readonly scenario: string;
  readonly description: string;
}

/**
 * 関連用語データの型
 */
export interface RelatedTermData {
  readonly termName: string;
  readonly relationshipType: string;
}

/**
 * 設計書全体の型
 */
export interface DesignDocumentData {
  readonly features: readonly FeatureData[];
  readonly terms: readonly TermData[];
}

/**
 * 機能定義の一覧項目の型
 */
export interface FeatureListItemData {
  readonly name: string;
  readonly purpose: string;
}

/**
 * ユビキタス言語の一覧項目の型
 */
export interface TermListItemData {
  readonly name: string;
  readonly definition: string;
  readonly category: string;
}

/**
 * 詳細取得結果の型
 */
export interface DetailsResponseData {
  readonly features: readonly FeatureData[];
  readonly terms: readonly TermData[];
  readonly notFound: {
    readonly featureNames: readonly string[];
    readonly termNames: readonly string[];
  };
}

/**
 * 操作結果の型
 */
export interface OperationResultData {
  readonly isUpdate: boolean;
}

/**
 * 削除結果の型
 */
export interface DeletionResultData {
  readonly found: boolean;
}

/**
 * 統計情報の型
 */
export interface StatisticsData {
  readonly featureCount: number;
  readonly termCount: number;
}
