import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class ProjectDetector {
    private readonly claudeProjectsDir: string;

    constructor() {
        this.claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
    }

    /**
     * Get Claude Code project directory corresponding to current VSCode workspace
     */
    public getClaudeProjectDir(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('No workspace folders found');
            return null;
        }

        // Use the first workspace folder
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const claudeDir = this.convertProjectPathToClaudeDir(workspacePath);
        console.log('Workspace path:', workspacePath);
        console.log('Claude project dir:', claudeDir);
        return claudeDir;
    }

    /**
     * Convert project path to Claude Code directory format
     * Example: /Users/aki/src/github.com/aki77/project -> ~/.claude/projects/-Users-aki-src-github-com-aki77-project
     */
    private convertProjectPathToClaudeDir(projectPath: string): string {
        // Convert project path to Claude directory format
        // Example: /Users/aki/src/github.com/aki77/project -> ~/.claude/projects/-Users-aki-src-github-com-aki77-project
        const normalizedPath = path.normalize(projectPath);
        
        // Replace all path separators with hyphens, then replace dots with hyphens
        const claudeDirName = normalizedPath.replace(/[/.]/g, '-');
        
        return path.join(this.claudeProjectsDir, claudeDirName);
    }

    /**
     * Check if Claude Code project directory exists
     */
    public claudeProjectDirExists(): boolean {
        const claudeDir = this.getClaudeProjectDir();
        if (!claudeDir) {
            console.log('Claude project dir is null');
            return false;
        }

        try {
            const exists = fs.existsSync(claudeDir) && fs.statSync(claudeDir).isDirectory();
            console.log('Claude project dir exists:', exists);
            return exists;
        } catch (error) {
            console.error('Error checking Claude project dir:', error);
            return false;
        }
    }

    /**
     * Get list of .jsonl files in Claude Code project directory
     */
    public getLogFiles(): string[] {
        const claudeDir = this.getClaudeProjectDir();
        if (!claudeDir || !this.claudeProjectDirExists()) {
            console.log('Claude dir not found or does not exist');
            return [];
        }

        try {
            const files = fs.readdirSync(claudeDir);
            console.log('Files in Claude dir:', files);
            const jsonlFiles = files
                .filter(file => file.endsWith('.jsonl'))
                .map(file => path.join(claudeDir, file))
                .sort((a, b) => {
                    // Sort by modification time (newest first)
                    const statA = fs.statSync(a);
                    const statB = fs.statSync(b);
                    return statB.mtime.getTime() - statA.mtime.getTime();
                });
            console.log('JSONL files found:', jsonlFiles);
            return jsonlFiles;
        } catch (error) {
            console.error('Error reading Claude project directory:', error);
            return [];
        }
    }
}