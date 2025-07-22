import * as vscode from 'vscode';
import { ClaudeLogAnalyzer } from './claudeLogAnalyzer';
import { ProjectDetector } from './projectDetector';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private logAnalyzer: ClaudeLogAnalyzer;
    private projectDetector: ProjectDetector;
    private fileWatcher: vscode.FileSystemWatcher | undefined;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.logAnalyzer = new ClaudeLogAnalyzer();
        this.projectDetector = new ProjectDetector();
        this.setupStatusBarItem();
        this.setupFileWatcher();

        console.log('StatusBarManager initialized');
        console.log('StatusBar item created and shown');
    }

    /**
     * Initialize status bar item settings
     */
    private setupStatusBarItem(): void {
        this.statusBarItem.command = 'claude-model-status.refresh';
        this.statusBarItem.tooltip = 'Click to refresh Claude model status';
        this.statusBarItem.text = '$(loading~spin) Claude: Loading...';
        this.statusBarItem.show();
    }

    /**
     * Update status bar
     */
    public async updateStatus(): Promise<void> {
        try {
            console.log('Updating status...');
            const statusText = await this.logAnalyzer.getStatusText();
            console.log('Status text:', statusText);
            this.statusBarItem.text = statusText;

            // Display detailed information in tooltip
            const currentModel = await this.logAnalyzer.getCurrentModel();
            console.log('Current model:', currentModel);
            if (currentModel) {
                this.statusBarItem.tooltip = `Current Claude model: ${currentModel}\nClick to refresh`;
            } else {
                this.statusBarItem.tooltip = 'Claude model not detected\nClick to refresh';
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.statusBarItem.text = 'Claude: Error';
            this.statusBarItem.tooltip = 'Error getting Claude model status\nClick to refresh';
        }
    }


    /**
     * Manually update status (when command is executed)
     */
    public async refresh(): Promise<void> {
        this.statusBarItem.text = '$(loading~spin) Claude: Refreshing...';
        await this.updateStatus();

        // Show temporary success message
        const currentText = this.statusBarItem.text;
        this.statusBarItem.text = `$(check) ${currentText.replace('🤖 ', '')}`;

        setTimeout(() => {
            this.statusBarItem.text = currentText;
        }, 1000);
    }

    /**
     * Show status bar item
     */
    public show(): void {
        this.statusBarItem.show();
    }

    /**
     * Hide status bar item
     */
    public hide(): void {
        this.statusBarItem.hide();
    }

    /**
     * Setup file watcher
     */
    private setupFileWatcher(): void {
        const claudeProjectDir = this.projectDetector.getClaudeProjectDir();
        if (!claudeProjectDir) {
            return;
        }

        // Watch .jsonl files in Claude Code log directory
        const pattern = new vscode.RelativePattern(claudeProjectDir, '*.jsonl');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        // Debounce processing for file changes
        let debounceTimer: NodeJS.Timeout | undefined;
        const debounceDelay = 500; // 500ms

        const debouncedUpdate = () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                this.updateStatus();
            }, debounceDelay);
        };

        // Update on file creation, modification, and deletion
        this.fileWatcher.onDidCreate(debouncedUpdate);
        this.fileWatcher.onDidChange(debouncedUpdate);
        this.fileWatcher.onDidDelete(debouncedUpdate);
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.statusBarItem.dispose();
    }
}
