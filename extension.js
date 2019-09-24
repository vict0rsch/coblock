// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const getMaxLineLen = () => {
    let editorConfig = vscode.workspace.getConfiguration();
    let maxLineLen = 79;
    if ("python" in editorConfig) {
        for (const key in editorConfig.python.linting.pep8Args) {
            if (editorConfig.python.linting.pep8Args.hasOwnProperty(key)) {
                const element = editorConfig.python.linting.pep8Args[key];
                if (element.indexOf("--max-line-length") > -1) {
                    maxLineLen = parseInt(element.split("=")[1], 10)
                }
            }
        }
    }
    return maxLineLen
}

/**
 * @param {string} input
 * @param {number} _offsetCount
 * @param {number} maxLineLen
 */
const getBlock = (input, _offsetCount, maxLineLen) => {
    const offsetCount = _offsetCount || 0;
    const offset = " ".repeat(offsetCount);

    let comment;
    let linesCount;
    let maxCommentLine = 0

    if (maxLineLen > 0 && input.length > (maxLineLen - 15 - offsetCount)) {
        // Line is too long, split it on spaces
        // create as many lines as necessary, no longer than maxLineLen
        // remove offset and CoBlock structure (# ----- bla -----\n)
        let comments = [];
        let splitInput = input.split(" ").reverse();
        let paddedComments = [];
        let commentLine = "";
        while (splitInput.length > 0) {
            const candidate = splitInput.pop();
            if (candidate) {
                if ((commentLine.length + candidate.length) < (maxLineLen - 15 - offsetCount)) {
                    commentLine += " " + candidate
                } else {
                    comments.push(commentLine);
                    if (commentLine.length > maxCommentLine) {
                        maxCommentLine = commentLine.length
                    }
                    commentLine = " " + candidate;
                }
            }
        }
        if (commentLine) {
            comments.push(commentLine)
        }
        linesCount = 2 + comments.length;
        for (let line of comments) {
            line += " ".repeat(maxCommentLine - line.length);
            paddedComments.push(line)
        }
        comment = "";
        for (const line of paddedComments) {
            comment += `${offset}# -----${line} -----\n`
        }
    } else {
        comment = `${offset}# ----- ${input} -----\n`;
        maxCommentLine = input.length + 1;
        linesCount = 3;
    }

    const line1 = `# ${'-'.repeat(maxCommentLine + 11)}\n`;
    const line2 = `${offset}# ${'-'.repeat(maxCommentLine + 11)}\n${offset}`;
    const block = line1 + comment + line2;
    return {
        block,
        linesCount
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let coblockInput = vscode.commands.registerCommand('extension.coblockInput', async function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        const input = await vscode.window.showInputBox();

        let editor = vscode.window.activeTextEditor;
        const maxLineLen = getMaxLineLen();

        if (editor) {
            let start = editor.selection.start;
            const {
                block,
                linesCount
            } = getBlock(input, start.character, maxLineLen)
            editor.edit(editBuilder => {
                editBuilder.insert(start, block);
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
            const input = textLine.text.trim()
            const maxLineLen = getMaxLineLen()
            const {
                block,
                linesCount
            } = getBlock(input, textLine.firstNonWhitespaceCharacterIndex, maxLineLen)

            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(start.line, textLine.firstNonWhitespaceCharacterIndex, start.line + 1, textLine.firstNonWhitespaceCharacterIndex), block);
            });
            const p = new vscode.Position(
                start.line + linesCount - 1,
                textLine.firstNonWhitespaceCharacterIndex + block.split("\n")[0].length
            );
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