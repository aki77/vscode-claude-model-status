# Claude Model Status

A VSCode extension that displays the currently used Claude Code model name in the status bar.

![Demo](https://i.gyazo.com/0d94a350c7a8ee429f76a3393d082218.png)

## Features

- **Real-time Model Display**: Shows the Claude model name currently in use for the workspace in the status bar
- **Latest Log Based**: Displays the model from the last executed Claude prompt  within the same project
- **Auto Update**: Monitors log file changes and automatically updates the status
- **Manual Refresh**: Click the status bar item to manually update
- **Fallback Function**: Retrieves from `~/.claude/settings.json` when detection from logs fails

### Display Examples

The status bar displays as follows:
- `⚡ Sonnet 4` - When using Claude Sonnet 4
- `⚡ Opus 4` - When using Claude Opus 4
- `⚡ Haiku 3` - When using Claude Haiku 3
- `Claude: Not detected` - When no model is detected

## Requirements

- **Claude Code**: Installed Claude Code CLI
- **VSCode**: Visual Studio Code 1.102.0 or higher

## Extension Settings

This extension automatically monitors Claude model status using file system watching and doesn't require any configuration.

## Usage

### After Installation

1. Open a Claude Code project in VSCode
2. The current model name will automatically appear in the status bar (bottom right)
3. Click the status bar icon for manual updates when needed

### How It Works

1. **Log File Search**: Identifies the `~/.claude/projects/` directory corresponding to the current workspace
2. **Model Extraction**: Extracts model information from assistant messages in the latest log files (`.jsonl`)
3. **Fallback**: Uses the `model` field from `~/.claude/settings.json` when unavailable from logs
4. **Display**: Shows the extracted model name in an easy-to-understand format in the status bar

## Commands

- `claude-model-status.refresh`: Manually update the status

## Known Issues

- Model information will not display if Claude Code is not installed
- When the project directory has no corresponding directory in `~/.claude/projects/`, fallback settings are used

---

## License

This project is published under the MIT License.

## Contributing

Please report bugs and feature requests through GitHub Issues.

**Enjoy!**
