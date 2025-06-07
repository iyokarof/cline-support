#!/usr/bin/env node

/**
 * clineサポート用サーバー エントリーポイント
 * クリーンアーキテクチャ・DDD・関数型プログラミングの原則に基づいてリファクタリング済み
 * 
 * 環境変数 SERVER_MODE によってMCPサーバーまたはREST APIサーバーを起動
 * - SERVER_MODE=mcp (デフォルト): MCPサーバーとして起動
 * - SERVER_MODE=rest: REST APIサーバーとして起動
 */

const serverMode = process.env.SERVER_MODE || 'mcp';

async function main() {
  try {
    switch (serverMode.toLowerCase()) {
      case 'rest':
        console.log('🌐 REST APIモードで起動しています...');
        const { RestServer } = await import('./infrastructure/rest/RestServer');
        const restServer = new RestServer();
        await restServer.run();
        break;
      
      case 'mcp':
      default:
        console.log('🔗 MCPモードで起動しています...');
        const { ClineSupportServer } = await import('./infrastructure/mcp/ClineSupportServer');
        const mcpServer = new ClineSupportServer();
        await mcpServer.run();
        break;
    }
  } catch (error) {
    console.error('サーバーの起動に失敗しました:', error);
    process.exit(1);
  }
}

// サーバーを開始
main();
