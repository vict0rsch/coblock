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
 * @param {string} inputText
 * @param {number} _offsetCount
 * @param {number} maxLineLen
 * @param {{ boxCharacter: string; spaceAround: number; numBlankLines: number; boxWidth: number; boxHeight: number; }} conf
 */
const getBlock = (inputText, _offsetCount, maxLineLen, languageId, conf) => {

    const inlineCommentCharacter = {
        "python": "#",
        "yaml": "#",
        "ssh_config": "#",
        "php": "#",
        "properties": "#",
        "perl": "#",
        "powershell": "#",
        "ruby": "#",
        "r": "#",
        "coffeescript": "#",
        "shellscrip": "#",
        "dockerfile": "#",
        "makefile": "#",
        "javascript": "//",
        "javascriptreact": "//",
        "less": "//",
        "c": "//",
        "cpp": "//",
        "csharp": "//",
        "java": "//",
        "go": "//",
        "scala": "//",
        "jsonc": "//",
        "objective-c": "//",
        "objective-cpp": "//",
        "swift": "//",
        "rust": "//",
        "latex": "%",
        "matlab": "%",
        "lua": "--",
        "sql": "--",
        "clojure": ";",
        "bat": "REM "
    }[languageId]

    const {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight
    } = conf;

    const commentStart = inlineCommentCharacter + " "

    const indentationSize = _offsetCount || 0;
    const indentation = " ".repeat(indentationSize);

    let content;
    let maxCommentLine = 0

    let linesCount = 2 * (boxHeight + numBlankLines);

    // remove left indentation (= indentation)
    // remove the left and right width and spaces arount the content
    // remove 2 for commentStart at the beginning of the line
    const maxContentLen = maxLineLen - indentationSize - 2 * (boxWidth + spaceAround) - commentStart.length;

    const separator = boxCharacter.repeat(boxWidth);
    const spaces = " ".repeat(spaceAround)


    if (
        (maxLineLen > 0 && inputText.length > maxContentLen) ||
        inputText.indexOf("\n") > -1
    ) {
        // inputText is too long or contains multiple lines
        // Treat each line independently, split it on spaces
        // create as many lines as necessary, no longer than maxLineLen

        let inputLines = inputText.split("\n")

        let contentLines = [];
        let paddedContentLines = [];

        for (const inputLine of inputLines) {

            let words = inputLine.split(" ").reverse();
            let contentLine = "";
            let stopLine = false;

            while (words.length > 0) {
                let word = words.pop();

                if (!word) continue;

                const newLineLength = contentLine.length + word.length + 1

                if (newLineLength < maxContentLen) {

                    contentLine += " " + word.replace("\n", "")

                    if (word.indexOf("\n") > -1) {
                        stopLine = true
                        word = ""
                    }

                } else {
                    stopLine = true;
                }

                if (stopLine) {

                    contentLine = contentLine.trimLeft();
                    contentLines.push(contentLine);
                    if (contentLine.length > maxCommentLine) {
                        maxCommentLine = contentLine.length
                    }
                    // If stopLine comes from contentLine being too long, 
                    // new contentLine should start with the word that caused 
                    // stopLine because it was not added
                    // Otherwise it comes from word containing \n and was therefore
                    // already added to the current contentLine
                    contentLine = word ? " " + word.replace("\n", "") : "";
                }

            }
            // Store last line
            if (contentLine) {
                contentLine = contentLine.trimLeft();
                contentLines.push(contentLine);
                if (contentLine.length > maxCommentLine) {
                    maxCommentLine = contentLine.length
                }
            }
            // Increase total block line count
            linesCount += contentLines.length - 1;
        }
        // Padd lines
        // (may raise "invalid count value" if there was an error computing maxCommentLine)
        for (const line of contentLines) {
            paddedContentLines.push(line + " ".repeat(maxCommentLine - line.length));
        }

        content = "";
        for (const line of paddedContentLines) {
            content += indentation + commentStart + separator + spaces + line.trimLeft() + spaces + separator + "\n";
        }

    } else {
        // inputText is not too long nor is it multiline
        content = indentation + commentStart + separator + spaces + inputText.trim() + spaces + separator + "\n";
        maxCommentLine = inputText.trim().length;
        linesCount += 1;
    }

    const blankLine = indentation + commentStart + separator + spaces + " ".repeat(maxCommentLine) + spaces + separator + "\n";
    const blankLines = blankLine.repeat(numBlankLines)

    const blockWidth = maxCommentLine + 2 * (spaceAround + boxWidth)

    const topLine = indentation + commentStart + boxCharacter.repeat(blockWidth) + "\n";
    const topBorder = topLine.repeat(boxHeight)

    const bottomLine = indentation + commentStart + boxCharacter.repeat(blockWidth) + "\n";
    const bottomBorder = bottomLine.repeat(boxHeight) + indentation;

    const block = topBorder + blankLines + content + blankLines + bottomBorder;
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
        const languageId = editor.document.languageId;
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
                languageId,
                conf
            );
            editor.edit(editBuilder => {
                editBuilder.insert(start, block);
            });
        }
    });

    let coblockLine = vscode.commands.registerCommand('extension.coblockLine', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        let editor = vscode.window.activeTextEditor;
        let input, startLine, endLine;

        const languageId = editor.document.languageId;

        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            if (selection.start.line !== selection.end.line) {
                // multiline selection
                startLine = document.lineAt(selection.start.line);
                endLine = document.lineAt(selection.end.line);
                input = document.getText(new vscode.Range(
                    selection.start.line,
                    startLine.firstNonWhitespaceCharacterIndex,
                    selection.end.line,
                    endLine.text.length
                ));

            } else {
                // single line selection
                const start = selection.start;
                startLine = document.lineAt(start.line);
                endLine = document.lineAt(start.line);
                input = startLine.text.trim()
            }

            const indentation = startLine.firstNonWhitespaceCharacterIndex;
            const maxLineLen = getMaxLineLen()
            const {
                block,
                linesCount
            } = getBlock(
                input,
                indentation,
                maxLineLen,
                languageId,
                conf
            );

            // replace document content with comment block
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(selection.start.line, 0, selection.end.line + 1, indentation), block);
            });

            // position cursor at the end of the added comment block
            const p = new vscode.Position(
                selection.start.line + linesCount - 1,
                indentation + block.split("\n")[0].length
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