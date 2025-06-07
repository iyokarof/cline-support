#!/usr/bin/env node
import { ClineSupportServer } from './infrastructure/mcp/ClineSupportServer';

/**
 * clineサポート用MCPサーバー エントリーポイント
 * クリーンアーキテクチャ・DDD・関数型プログラミングの原則に基づいてリファクタリング済み
 */

// サーバーを開始
const server = new ClineSupportServer();
server.run().catch(console.error);
