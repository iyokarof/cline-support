import { Feature, Term, AddOrUpdateFeatureArgs, DeleteFeatureArgs, AddOrUpdateTermArgs, DeleteTermArgs, GetDetailsArgs } from './types.js';

/**
 * 機能定義の必須フィールドを検証する
 */
export function validateFeature(feature: any): feature is Feature {
  if (!feature || typeof feature !== 'object') {
    return false;
  }

  // feature基本情報の検証
  if (!feature.feature || typeof feature.feature !== 'object') {
    return false;
  }

  if (typeof feature.feature.name !== 'string' || !feature.feature.name.trim()) {
    return false;
  }

  if (typeof feature.feature.purpose !== 'string' || !feature.feature.purpose.trim()) {
    return false;
  }

  if (!Array.isArray(feature.feature.userStories)) {
    return false;
  }

  // 配列フィールドの検証
  if (!Array.isArray(feature.inputs) || 
      !Array.isArray(feature.outputs) ||
      !Array.isArray(feature.coreLogicSteps) ||
      !Array.isArray(feature.errorHandling) ||
      !Array.isArray(feature.nonFunctionalRequirements) ||
      !Array.isArray(feature.documentationNotes)) {
    return false;
  }

  // inputs配列の検証
  for (const input of feature.inputs) {
    if (!input || typeof input !== 'object') {
      return false;
    }
    if (typeof input.name !== 'string' || 
        typeof input.dataTypeDescription !== 'string' ||
        typeof input.purpose !== 'string' ||
        !Array.isArray(input.constraints)) {
      return false;
    }
  }

  // outputs配列の検証
  for (const output of feature.outputs) {
    if (!output || typeof output !== 'object') {
      return false;
    }
    if (typeof output.condition !== 'string' ||
        typeof output.dataDescription !== 'string' ||
        typeof output.structureHint !== 'object') {
      return false;
    }
  }

  // coreLogicSteps配列の検証
  for (const step of feature.coreLogicSteps) {
    if (!step || typeof step !== 'object') {
      return false;
    }
    if (typeof step.stepNumber !== 'number' ||
        typeof step.description !== 'string' ||
        typeof step.output !== 'string' ||
        !Array.isArray(step.inputs)) {
      return false;
    }
  }

  return true;
}

/**
 * ユビキタス言語情報の必須フィールドを検証する
 */
export function validateTerm(term: any): term is Term {
  if (!term || typeof term !== 'object') {
    return false;
  }

  // term基本情報の検証
  if (!term.term || typeof term.term !== 'object') {
    return false;
  }

  if (typeof term.term.name !== 'string' || !term.term.name.trim()) {
    return false;
  }

  if (typeof term.term.definition !== 'string' || !term.term.definition.trim()) {
    return false;
  }

  if (!Array.isArray(term.term.aliases)) {
    return false;
  }

  if (!term.term.context || typeof term.term.context !== 'object') {
    return false;
  }

  if (typeof term.term.context.boundedContext !== 'string' ||
      typeof term.term.context.scope !== 'string') {
    return false;
  }

  // details検証
  if (!term.details || typeof term.details !== 'object') {
    return false;
  }

  if (typeof term.details.category !== 'string' ||
      !Array.isArray(term.details.examples) ||
      !Array.isArray(term.details.ambiguitiesAndBoundaries)) {
    return false;
  }

  // relationships検証
  if (!term.relationships || typeof term.relationships !== 'object') {
    return false;
  }

  if (!Array.isArray(term.relationships.relatedTerms) ||
      !Array.isArray(term.relationships.associatedFunctions)) {
    return false;
  }

  // implementation検証
  if (!term.implementation || typeof term.implementation !== 'object') {
    return false;
  }

  if (typeof term.implementation.codeMapping !== 'string' ||
      typeof term.implementation.dataStructureHint !== 'object' ||
      !Array.isArray(term.implementation.constraints)) {
    return false;
  }

  return true;
}

/**
 * ツールの引数を検証する
 */
export function validateAddOrUpdateFeatureArgs(args: any): args is AddOrUpdateFeatureArgs {
  return args && typeof args === 'object' && validateFeature(args.feature);
}

export function validateDeleteFeatureArgs(args: any): args is DeleteFeatureArgs {
  return args && typeof args === 'object' && 
         typeof args.featureName === 'string' && 
         args.featureName.trim().length > 0;
}

export function validateAddOrUpdateTermArgs(args: any): args is AddOrUpdateTermArgs {
  return args && typeof args === 'object' && validateTerm(args.term);
}

export function validateDeleteTermArgs(args: any): args is DeleteTermArgs {
  return args && typeof args === 'object' && 
         typeof args.termName === 'string' && 
         args.termName.trim().length > 0;
}

export function validateGetDetailsArgs(args: any): args is GetDetailsArgs {
  if (!args || typeof args !== 'object') {
    return true; // 引数なしも許可
  }

  if (args.featureNames !== undefined && !Array.isArray(args.featureNames)) {
    return false;
  }

  if (args.termNames !== undefined && !Array.isArray(args.termNames)) {
    return false;
  }

  // 配列の中身が全て文字列かチェック
  if (args.featureNames && !args.featureNames.every((name: any) => typeof name === 'string')) {
    return false;
  }

  if (args.termNames && !args.termNames.every((name: any) => typeof name === 'string')) {
    return false;
  }

  return true;
}
