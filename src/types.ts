/**
 * 機能設計書の型定義
 */
export interface Feature {
  feature: {
    name: string;
    purpose: string;
    userStories: string[];
  };
  inputs: Input[];
  outputs: Output[];
  coreLogicSteps: CoreLogicStep[];
  errorHandling: ErrorHandling[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  documentationNotes: string[];
}

export interface Input {
  name: string;
  dataTypeDescription: string;
  constraints: string[];
  purpose: string;
}

export interface Output {
  condition: string;
  dataDescription: string;
  structureHint: Record<string, any>;
}

export interface CoreLogicStep {
  stepNumber: number;
  description: string;
  inputs: string[];
  output: string;
}

export interface ErrorHandling {
  errorCondition: string;
  detectionPoint: string;
  handlingStrategyDescription: string;
  resultingOutputCondition: string;
}

export interface NonFunctionalRequirement {
  requirement: string;
  considerationsForLogic: string;
}

/**
 * ユビキタス言語の型定義
 */
export interface Term {
  term: {
    name: string;
    definition: string;
    aliases: string[];
    context: {
      boundedContext: string;
      scope: string;
    };
  };
  details: {
    category: string;
    examples: Example[];
    ambiguitiesAndBoundaries: string[];
  };
  relationships: {
    relatedTerms: RelatedTerm[];
    associatedFunctions: string[];
  };
  implementation: {
    codeMapping: string;
    dataStructureHint: Record<string, any>;
    constraints: string[];
  };
}

export interface Example {
  scenario: string;
  description: string;
}

export interface RelatedTerm {
  termName: string;
  relationshipType: string;
}

/**
 * 設計書全体の型定義
 */
export interface DesignDocument {
  features: Feature[];
  terms: Term[];
}

/**
 * ツールの入力パラメータ型定義
 */
export interface AddOrUpdateFeatureArgs {
  feature: Feature;
}

export interface DeleteFeatureArgs {
  featureName: string;
}

export interface AddOrUpdateTermArgs {
  term: Term;
}

export interface DeleteTermArgs {
  termName: string;
}

export interface GetDetailsArgs {
  featureNames?: string[];
  termNames?: string[];
}

/**
 * リソースの応答型定義
 */
export interface FeatureListItem {
  name: string;
  purpose: string;
}

export interface TermListItem {
  name: string;
  definition: string;
  category: string;
}

export interface DetailsResponse {
  features: Feature[];
  terms: Term[];
  notFound: {
    featureNames: string[];
    termNames: string[];
  };
}
