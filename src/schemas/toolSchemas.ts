/**
 * MCPツールのJSON Schema定義
 * template/design.jsonの構造に基づく正確なスキーマ
 */

/**
 * 機能定義追加・更新ツールのスキーマ
 */
export const addOrUpdateFeatureSchema = {
  type: 'object',
  properties: {
    feature: {
      type: 'object',
      properties: {
        feature: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '機能の簡潔な名前（例: KeywordExtractor）'
            },
            purpose: {
              type: 'string',
              description: 'この機能が何を達成するためのものか、1-2文で説明'
            },
            userStories: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'この機能が解決するユーザーシナリオの配列'
            }
          },
          required: ['name', 'purpose', 'userStories'],
          additionalProperties: false
        },
        inputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '入力パラメータの概念名'
              },
              dataTypeDescription: {
                type: 'string',
                description: 'データの種類や期待される形式の言語非依存な説明'
              },
              constraints: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '制約条件のリスト'
              },
              purpose: {
                type: 'string',
                description: 'この入力が機能の中でどのように使われるか'
              }
            },
            required: ['name', 'dataTypeDescription', 'constraints', 'purpose'],
            additionalProperties: false
          },
          description: '機能への入力パラメータの配列'
        },
        outputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: {
                type: 'string',
                description: '出力条件の説明'
              },
              dataDescription: {
                type: 'string',
                description: '出力されるデータの言語非依存な説明'
              },
              structureHint: {
                type: 'object',
                description: '構造のヒント'
              }
            },
            required: ['condition', 'dataDescription', 'structureHint'],
            additionalProperties: false
          },
          description: '機能からの出力の配列'
        },
        coreLogicSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: {
                type: 'integer',
                minimum: 1,
                description: '処理の順序'
              },
              description: {
                type: 'string',
                description: 'このステップで行う主要な処理内容の簡潔な説明'
              },
              inputs: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'このステップで使用するデータの名前やステップ番号'
              },
              output: {
                type: 'string',
                description: 'このステップが生み出す主要な中間データや最終結果の名前'
              }
            },
            required: ['stepNumber', 'description', 'inputs', 'output'],
            additionalProperties: false
          },
          description: '機能の主要な論理ステップの配列'
        },
        errorHandling: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorCondition: {
                type: 'string',
                description: '想定されるエラーや例外的な状況の説明'
              },
              detectionPoint: {
                type: 'string',
                description: 'どのcoreLogicStepでこのエラーが検知されうるか'
              },
              handlingStrategyDescription: {
                type: 'string',
                description: 'このエラーをどのように処理するかの言語非依存な方針'
              },
              resultingOutputCondition: {
                type: 'string',
                description: 'このエラー処理の結果、どのoutputsのconditionに合致するか'
              }
            },
            required: ['errorCondition', 'detectionPoint', 'handlingStrategyDescription', 'resultingOutputCondition'],
            additionalProperties: false
          },
          description: 'エラーハンドリングの配列'
        },
        nonFunctionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: {
                type: 'string',
                description: '非機能要件'
              },
              considerationsForLogic: {
                type: 'string',
                description: 'この要件がcoreLogicStepsにどう影響するか'
              }
            },
            required: ['requirement', 'considerationsForLogic'],
            additionalProperties: false
          },
          description: '非機能要件の配列'
        },
        documentationNotes: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'この機能を理解する上で特に重要となる点や、ドキュメントに残すべき設計判断'
        }
      },
      required: ['feature', 'inputs', 'outputs', 'coreLogicSteps', 'errorHandling', 'nonFunctionalRequirements', 'documentationNotes'],
      additionalProperties: false,
      description: '機能設計書の完全な定義'
    }
  },
  required: ['feature'],
  additionalProperties: false
} as const;

/**
 * ユビキタス言語追加・更新ツールのスキーマ
 */
export const addOrUpdateTermSchema = {
  type: 'object',
  properties: {
    term: {
      type: 'object',
      properties: {
        term: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '正規の用語名。チームで合意した唯一の名称'
            },
            definition: {
              type: 'string',
              description: 'この用語が何を指すのか、ビジネスの観点から明確かつ簡潔に説明'
            },
            aliases: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '別名や同義語のリスト'
            },
            context: {
              type: 'object',
              properties: {
                boundedContext: {
                  type: 'string',
                  description: 'この用語が主に使われる境界づけられたコンテキスト'
                },
                scope: {
                  type: 'string',
                  description: 'この用語の適用範囲に関する補足説明'
                }
              },
              required: ['boundedContext', 'scope'],
              additionalProperties: false
            }
          },
          required: ['name', 'definition', 'aliases', 'context'],
          additionalProperties: false
        },
        details: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: '用語の分類（例: エンティティ、値オブジェクト、ドメインイベント、ポリシー）'
            },
            examples: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenario: {
                    type: 'string',
                    description: 'この用語が使われる具体的なシナリオ'
                  },
                  description: {
                    type: 'string',
                    description: 'シナリオ内での用例や振る舞いの説明'
                  }
                },
                required: ['scenario', 'description'],
                additionalProperties: false
              },
              description: '用語の使用例'
            },
            ambiguitiesAndBoundaries: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'よくある誤解や、この用語が「何を指さないか」を明確にする記述のリスト'
            }
          },
          required: ['category', 'examples', 'ambiguitiesAndBoundaries'],
          additionalProperties: false
        },
        relationships: {
          type: 'object',
          properties: {
            relatedTerms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  termName: {
                    type: 'string',
                    description: '関連する別の用語のname'
                  },
                  relationshipType: {
                    type: 'string',
                    description: '関連の種類を説明'
                  }
                },
                required: ['termName', 'relationshipType'],
                additionalProperties: false
              },
              description: '関連する用語のリスト'
            },
            associatedFunctions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'この用語が深く関連する機能の名前'
            }
          },
          required: ['relatedTerms', 'associatedFunctions'],
          additionalProperties: false
        },
        implementation: {
          type: 'object',
          properties: {
            codeMapping: {
              type: 'string',
              description: 'ソースコード上での対応物。クラス名、型名、変数名など'
            },
            dataStructureHint: {
              type: 'object',
              description: 'データ構造のヒント'
            },
            constraints: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'データとしての制約条件'
            }
          },
          required: ['codeMapping', 'dataStructureHint', 'constraints'],
          additionalProperties: false
        }
      },
      required: ['term', 'details', 'relationships', 'implementation'],
      additionalProperties: false,
      description: 'ユビキタス言語情報の完全な定義'
    }
  },
  required: ['term'],
  additionalProperties: false
} as const;

/**
 * 機能削除ツールのスキーマ
 */
export const deleteFeatureSchema = {
  type: 'object',
  properties: {
    featureName: {
      type: 'string',
      minLength: 1,
      description: '削除する機能の名前'
    }
  },
  required: ['featureName'],
  additionalProperties: false
} as const;

/**
 * 用語削除ツールのスキーマ
 */
export const deleteTermSchema = {
  type: 'object',
  properties: {
    termName: {
      type: 'string',
      minLength: 1,
      description: '削除する用語の名前'
    }
  },
  required: ['termName'],
  additionalProperties: false
} as const;

/**
 * 詳細取得ツールのスキーマ
 */
export const getDetailsSchema = {
  type: 'object',
  properties: {
    featureNames: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      description: '取得したい機能定義の名前のリスト（省略可能）',
      uniqueItems: true
    },
    termNames: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      description: '取得したいユビキタス言語情報の名前のリスト（省略可能）',
      uniqueItems: true
    }
  },
  additionalProperties: false
} as const;
