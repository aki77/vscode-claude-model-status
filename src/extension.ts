import * as vscode from 'vscode';
import { StatusBarManager } from './statusBarManager';

let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
	console.log('Claude Model Status extension is now active!');

	// Debug output workspace information
	const workspaceFolders = vscode.workspace.workspaceFolders;
	console.log('Workspace folders:', workspaceFolders?.map(f => f.uri.fsPath));

	// Initialize status bar manager
	statusBarManager = new StatusBarManager();

	// Register manual refresh command
	const refreshCommand = vscode.commands.registerCommand('claude-model-status.refresh', async () => {
		await statusBarManager.refresh();
	});

	// Start auto-update
	statusBarManager.startAutoUpdate();

	// Register cleanup for when extension is deactivated
	context.subscriptions.push(
		refreshCommand,
		statusBarManager
	);

	console.log('Claude Model Status: Setup completed');
}

export function deactivate() {
	if (statusBarManager) {
		statusBarManager.dispose();
	}
}
