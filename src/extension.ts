import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Archery Master extension is now active!');

    let disposable = vscode.commands.registerCommand('archery.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'archeryGame',
            'Archery Master',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'media', 'game.js'));
    const stylePathOnDisk = vscode.Uri.file(path.join(extensionPath, 'media', 'style.css'));
    const htmlPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'media', 'index.html'));

    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);

    let html = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');

    // Replace placeholders with correct URIs
    html = html.replace('${styleUri}', styleUri.toString());
    html = html.replace('${scriptUri}', scriptUri.toString());

    return html;
}

export function deactivate() { }
