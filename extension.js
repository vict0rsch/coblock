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
const getBlock = (input, _offsetCount, maxLineLen, conf) => {

    const {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight
    } = conf;

    const offsetCount = _offsetCount || 0;
    const offset = " ".repeat(offsetCount);

    let comment;
    let maxCommentLine = 0
    let linesCount = 2 * (boxHeight + numBlankLines);

    const separator = boxCharacter.repeat(boxWidth);
    const spaces = " ".repeat(spaceAround)

    if (maxLineLen > 0 && input.length > (maxLineLen - 2 - 2 * boxWidth - offsetCount - 2 * spaceAround)) {
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
                if ((commentLine.length + candidate.length) < (maxLineLen - 2 - 2 * boxWidth - offsetCount - 2 * spaceAround)) {
                    commentLine += " " + candidate
                } else {
                    commentLine = commentLine.trimLeft();
                    comments.push(commentLine);
                    if (commentLine.length > maxCommentLine) {
                        maxCommentLine = commentLine.length
                    }
                    commentLine = " " + candidate;
                }
            }
        }
        // Store last line
        if (commentLine) {
            comments.push(commentLine.trimLeft());
        }
        // Increase total block line count
        linesCount += comments.length;
        // Padd lines
        for (const line of comments) {
            paddedComments.push(line + " ".repeat(maxCommentLine - line.length));
        }

        comment = "";
        for (const line of paddedComments) {
            comment += offset + "# " + separator + spaces + line.trimLeft() + spaces + separator + "\n";
        }
    } else {
        comment = offset + "# " + separator + spaces + input.trim() + spaces + separator + "\n";
        maxCommentLine = input.trim().length;
        linesCount += 1;
    }

    const blankLine = offset + "# " + separator + spaces + " ".repeat(maxCommentLine) + spaces + separator + "\n";
    const blankLines = blankLine.repeat(numBlankLines)

    const topLine = `# ${boxCharacter.repeat(maxCommentLine + 2 * (spaceAround + boxWidth))}\n`;
    let topBorder = topLine
    if (boxHeight > 1) {
        const offsetTopLine = offset + topLine;
        topBorder += offsetTopLine.repeat(boxHeight - 1);
    }

    const bottomLine = `${offset}# ${boxCharacter.repeat(maxCommentLine + 2 * (spaceAround + boxWidth))}\n`;
    const bottomBorder = bottomLine.repeat(boxHeight) + offset;

    const block = topBorder + blankLines + comment + blankLines + bottomBorder;
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

    const coblockConf = vscode.workspace.getConfiguration('coblock');
    console.log(coblockConf);
    let {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight
    } = coblockConf;
    boxCharacter = boxCharacter[0];
    spaceAround = spaceAround || 1;
    spaceAround = Math.max(spaceAround, 0);
    numBlankLines = numBlankLines || 0;
    numBlankLines = Math.max(numBlankLines, 0);
    boxWidth = boxWidth || 5;
    boxWidth = Math.max(boxWidth, 1);
    boxHeight = boxHeight || 1;
    boxHeight = Math.max(boxHeight, 1);

    const conf = {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight
    };

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
            } = getBlock(
                input,
                start.character,
                maxLineLen,
                conf
            );
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
            } = getBlock(
                input,
                textLine.firstNonWhitespaceCharacterIndex,
                maxLineLen,
                conf
            );

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