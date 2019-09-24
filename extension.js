// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */



function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "coblock" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let coblockInput = vscode.commands.registerCommand('extension.coblockInput', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		const input = await vscode.window.showInputBox();

		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let start = editor.selection.start;
			const offset = " ".repeat(start.character);
			const comment = `----- ${input} -----`;
			const line1 = `# ${'-'.repeat(comment.length)}\n`;
			const line2 = `${offset}# ${'-'.repeat(comment.length)}\n${offset}`;
			const block = `${offset}# ${comment}\n`;

			editor.edit(editBuilder => {
				editBuilder.insert(start, line1 + block + line2);
			});
		}
	});

	let coblockLine = vscode.commands.registerCommand('extension.coblockLine', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;
			let start = editor.selection.start;

			const textLine = document.lineAt(start.line);
			const offset = " ".repeat(textLine.firstNonWhitespaceCharacterIndex);
			const input = textLine.text.trim()

			const comment = `----- ${input} -----`;
			const line1 = `# ${'-'.repeat(comment.length)}\n`;
			const block = `${offset}# ${comment}\n`;
			const line2 = `${offset}# ${'-'.repeat(comment.length)}\n${offset}`;

			editor.edit(editBuilder => {
				editBuilder.replace(new vscode.Range(start.line, textLine.firstNonWhitespaceCharacterIndex, start.line + 1, textLine.firstNonWhitespaceCharacterIndex), line1 + block + line2);
			});
			const p = new vscode.Position(start.line + 2, textLine.firstNonWhitespaceCharacterIndex + line1.length);
			vscode.window.activeTextEditor.selection = new vscode.Selection(p, p);
		}
	});

	context.subscriptions.push(coblockInput);
	context.subscriptions.push(coblockLine);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}