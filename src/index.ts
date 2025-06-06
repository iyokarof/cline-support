#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { DataManager } from './dataManager.js';
import { ResourceHandlers } from './handlers/resourceHandlers.js';
import { ToolHandlers } from './handlers/toolHandlers.js';

/**
 * clineサポート用MCPサーバー
 * プロジェクトの機能定義とユビキタス言語情報を管理する
 */
class ClineSupportServer {
  private server: Server;
  private dataManager: DataManager;
  private resourceHandlers: ResourceHandlers;
  private toolHandlers: ToolHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'cline-support-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.dataManager = new DataManager();
    this.resourceHandlers = new ResourceHandlers(this.server, this.dataManager);
    this.toolHandlers = new ToolHandlers(this.server, this.dataManager);

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * ハンドラーを設定する
   */
  private setupHandlers(): void {
    this.resourceHandlers.setup();
    this.toolHandlers.setup();
  }

  /**
   * エラーハンドリングの設定
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * サーバーを開始する
   */
  async run(): Promise<void> {
    await this.dataManager.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cline Support MCP Server running on stdio');
  }
}

// サーバーを開始
const server = new ClineSupportServer();
server.run().catch(console.error);
