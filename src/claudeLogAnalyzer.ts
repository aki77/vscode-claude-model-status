import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import * as os from 'os';
import { ProjectDetector } from './projectDetector';

interface ClaudeLogEntry {
    type: string;
    message?: {
        role: string;
        model?: string;
    };
}

interface ClaudeSettings {
    model?: string;
}

export class ClaudeLogAnalyzer {
    private projectDetector: ProjectDetector;

    constructor() {
        this.projectDetector = new ProjectDetector();
    }

    /**
     * Get currently used Claude model
     */
    public async getCurrentModel(): Promise<string | null> {
        try {
            const logFiles = this.projectDetector.getLogFiles();
            if (logFiles.length > 0) {
                // Process all log files (newest first)
                for (const logFile of logFiles) {
                    const model = await this.extractModelFromLog(logFile);
                    if (model) {
                        return model;
                    }
                }
            }

            // Fallback to settings.json if not available from logs
            console.log('No model found in logs, trying settings.json fallback');
            return await this.getModelFromSettings();
        } catch (error) {
            console.error('Error getting current model:', error);
            return null;
        }
    }


    /**
     * Extract model from the last assistant message in log file
     */
    private async extractModelFromLog(filePath: string): Promise<string | null> {
        try {
            // Efficiently get only the last 100 lines of the file
            const stats = await fs.promises.stat(filePath);
            const fileSize = stats.size;
            
            // Read entire file if it's small
            if (fileSize < 10000) {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const lines = content.split('\n').reverse();
                return this.findModelInLines(lines);
            }

            // For large files, read appropriate size from the end
            const readSize = Math.min(50000, fileSize); // 最大50KB
            const buffer = Buffer.allocUnsafe(readSize);
            const fileHandle = await fs.promises.open(filePath, 'r');
            
            try {
                await fileHandle.read(buffer, 0, readSize, fileSize - readSize);
                const content = buffer.toString('utf8');
                const lines = content.split('\n').reverse();
                
                // Process maximum 100 lines
                const limitedLines = lines.slice(0, 100);
                return this.findModelInLines(limitedLines);
            } finally {
                await fileHandle.close();
            }
        } catch (error) {
            console.error('Error extracting model from log:', error);
            return null;
        }
    }

    /**
     * Search for model information from array of lines
     */
    private findModelInLines(lines: string[]): string | null {
        for (const line of lines) {
            if (!line.trim()) {
                continue;
            }

            try {
                const entry: ClaudeLogEntry = JSON.parse(line);
                if (entry.type === 'assistant' &&
                    entry.message?.role === 'assistant' &&
                    entry.message.model) {
                    return entry.message.model;
                }
            } catch {
                // Ignore JSON parsing errors and continue to next line
                continue;
            }
        }
        return null;
    }

    /**
     * Format model name for display
     */
    public formatModelName(modelId: string): string {
        // claude-sonnet-4-20250514 → Sonnet 4
        const modelPatterns: { [key: string]: string } = {
            'claude-sonnet-4': 'Sonnet 4',
            'claude-haiku-3': 'Haiku 3',
            'claude-opus-4': 'Opus 4'
        };

        for (const [pattern, displayName] of Object.entries(modelPatterns)) {
            if (modelId.includes(pattern)) {
                return displayName;
            }
        }

        // Return original name if no pattern matches
        return modelId;
    }

    /**
     * Get model information from Claude settings file (fallback)
     */
    private async getModelFromSettings(): Promise<string | null> {
        try {
            const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
            // Check file existence asynchronously
            try {
                await fs.promises.access(settingsPath);
            } catch {
                console.log('Settings file not found:', settingsPath);
                return null;
            }

            const settingsContent = await fs.promises.readFile(settingsPath, 'utf8');
            const settings: ClaudeSettings = JSON.parse(settingsContent);

            if (settings.model) {
                console.log('Found model in settings.json:', settings.model);
                return settings.model;
            }

            return null;
        } catch (error) {
            console.error('Error reading settings.json:', error);
            return null;
        }
    }

    /**
     * Generate display text for status bar
     */
    public async getStatusText(): Promise<string> {
        const model = await this.getCurrentModel();
        if (!model) {
            return 'Claude: Not detected';
        }

        const formattedName = this.formatModelName(model);
        return `$(zap) ${formattedName}`;
    }
}
