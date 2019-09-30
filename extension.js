// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const inlineCommentCharacters = {
    "bat": "REM ",
    "c": "//",
    "clojure": ";",
    "coffeescript": "#",
    "cpp": "//",
    "csharp": "//",
    "dockerfile": "#",
    "go": "//",
    "java": "//",
    "javascript": "//",
    "javascriptreact": "//",
    "jsonc": "//",
    "latex": "%",
    "less": "//",
    "lua": "--",
    "makefile": "#",
    "matlab": "%",
    "objective-c": "//",
    "objective-cpp": "//",
    "perl": "#",
    "php": "#",
    "powershell": "#",
    "properties": "#",
    "python": "#",
    "r": "#",
    "ruby": "#",
    "rust": "//",
    "scala": "//",
    "scss": "//",
    "shellscrip": "#",
    "sql": "--",
    "ssh_config": "#",
    "swift": "//",
    "yaml": "#",
};

const blockCommentCharacters = {
    "html": {
        "start": "<!--",
        "end": "-->"
    },
    "xml": {
        "start": "<!--",
        "end": "-->"
    },
    "css": {
        "start": "/*",
        "end": "*/"
    },
    "c": {
        "start": "/*",
        "end": "*/"
    },
    "java": {
        "start": "/*",
        "end": "*/"
    },
    "javascript": {
        "start": "/*",
        "end": "*/"
    },
    "swift": {
        "start": "/*",
        "end": "*/"
    },
    "rust": {
        "start": "/*",
        "end": "*/"
    },
    "scala": {
        "start": "/*",
        "end": "*/"
    },
    "php": {
        "start": "<#",
        "end": "#>"
    },
    "c": {
        "start": "<#",
        "end": "#>"
    },
    "cpp": {
        "start": "<#",
        "end": "#>"
    },
    "ruby": {
        "start": "=begin",
        "end": "=end"
    }
};

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
 * @param {number} maxContentLen
 * @param {string} indentation
 * @param {string} commentLine
 * @param {string} separator
 * @param {string} spaces
 */
const getMultilineContent = (inputText, maxContentLen, indentation, commentLine, separator, spaces) => {
    // inputText is too long or contains multiple lines
    // Treat each line independently, split it on spaces
    // create as many lines as necessary, no longer than maxLineLen

    let inputLines = inputText.split("\n");
    let currentMaxContentLength = 0;
    let contentLines = [];

    for (const inputLine of inputLines) {

        let words = inputLine.split(" ").reverse();
        let contentLine = "";
        let stopLine = false;

        while (words.length > 0) {
            let word = words.pop();
            if (!word) continue;

            const newLineLength = contentLine.length + word.length + 1;
            if (newLineLength < maxContentLen) {
                contentLine += " " + word.replace("\n", "");
                if (word.indexOf("\n") > -1) {
                    stopLine = true;
                    word = "";
                }
            } else {
                stopLine = true;
            }
            if (stopLine) {
                contentLine = contentLine.trimLeft();
                contentLines.push(contentLine);
                if (contentLine.length > currentMaxContentLength) {
                    currentMaxContentLength = contentLine.length;
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
            if (contentLine.length > currentMaxContentLength) {
                currentMaxContentLength = contentLine.length;
            }
        }
    }
    // Increase total block line count

    // Padd lines
    // (may raise "invalid count value" if there was an error computing currentMaxContentLength)
    const paddedContentLines = contentLines.map(
        (line, i) => line + " ".repeat(currentMaxContentLength - line.length)
    );

    return {
        content: paddedContentLines.map(
            (line, i) => indentation + commentLine + separator + spaces + line.trimLeft() + spaces + separator
        ).join("\n") + "\n",
        linesCount: contentLines.length,
        maxContentLength: currentMaxContentLength
    }
}

const getConf = () => {
    const coblockConf = vscode.workspace.getConfiguration('coblock');

    let {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight,
        preferBlockComment
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

    return {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight,
        preferBlockComment
    };
}

/**
 * @param {string} inputText
 * @param {number} _offsetCount
 * @param {number} maxLineLen
 * @param {string} languageId
 */
const getBlock = (inputText, _offsetCount, maxLineLen, languageId) => {

    // ---------------------------
    // -----    Variables    -----
    // ---------------------------
    const {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight,
        preferBlockComment
    } = getConf();
    let commentCharacters, commentLine, isBlockComment, content, cursorOffset, maxContentLength;
    const indentationSize = _offsetCount || 0;
    const indentation = " ".repeat(indentationSize);
    let linesCount = 2 * (boxHeight + numBlankLines);


    // ------------------------------------
    // -----    Set Comment Params    -----
    // ------------------------------------

    if (preferBlockComment || !(languageId in inlineCommentCharacters)) {
        commentCharacters = blockCommentCharacters[languageId];
        commentLine = "";
        isBlockComment = true;
    }

    if (!commentCharacters) {
        commentCharacters = {
            "start": inlineCommentCharacters[languageId],
            "end": ""
        };
        commentLine = commentCharacters.start + " ";
        isBlockComment = false;
    }

    if (!commentCharacters.start) throw "Unknown languageId: " + languageId;

    let commentStart = commentCharacters.start;
    let commentEnd = commentCharacters.end;

    // remove left indentation (= indentation)
    // remove the left and right width and spaces arount the content
    // remove 2 for commentStart at the beginning of the line
    const maxContentLen = maxLineLen - indentationSize - 2 * (boxWidth + spaceAround) - commentStart.length;

    // vertical border
    const separator = boxCharacter.repeat(boxWidth);
    // spaces between vertical border and content
    const spaces = " ".repeat(spaceAround);


    if (
        (maxLineLen > 0 && inputText.length > maxContentLen) ||
        inputText.indexOf("\n") > -1
    ) {
        const multilineContent = getMultilineContent(inputText, maxContentLen, indentation, commentLine, separator, spaces);
        content = multilineContent.content;
        linesCount = multilineContent.linesCount;
        maxContentLength = multilineContent.maxContentLength;
    } else {
        // inputText is not too long nor is it multiline
        content = indentation + commentLine + separator + spaces + inputText.trim() + spaces + separator + "\n";
        maxContentLength = inputText.trim().length;
        linesCount += 1;
    }
    const blockWidth = maxContentLength + 2 * (spaceAround + boxWidth);
    const blankLines = (indentation + commentLine + separator + spaces + " ".repeat(maxContentLength) + spaces + separator + "\n").repeat(numBlankLines);
    let topBorder = (indentation + commentLine + boxCharacter.repeat(blockWidth) + "\n").repeat(boxHeight);
    let bottomBorder = (indentation + commentLine + boxCharacter.repeat(blockWidth) + "\n").repeat(boxHeight);

    cursorOffset = topBorder.split('\n')[0].length;
    if (isBlockComment) {
        topBorder = indentation + commentStart + "\n" + topBorder;
        bottomBorder = bottomBorder + indentation + commentEnd;
        linesCount += 2
        cursorOffset = indentationSize + commentEnd.length;
    }

    const block = topBorder + blankLines + content + blankLines + bottomBorder;
    return {
        block,
        linesCount,
        cursorOffset
    }
}

async function coblockInput() {
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
            linesCount,
            cursorOffset
        } = getBlock(
            input,
            start.character,
            maxLineLen,
            languageId,
        );
        editor.edit(editBuilder => {
            editBuilder.insert(start, block);
        });
    }
}

function coblockLine() {

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

        const indentationSize = startLine.firstNonWhitespaceCharacterIndex;
        const maxLineLen = getMaxLineLen()
        const {
            block,
            linesCount,
            cursorOffset
        } = getBlock(
            input,
            indentationSize,
            maxLineLen,
            languageId,
        );

        // replace document content with comment block
        editor.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(selection.start.line, 0, selection.end.line + 1, indentationSize), block);
        });

        // position cursor at the end of the added comment block
        const p = new vscode.Position(
            selection.start.line + linesCount - 1,
            cursorOffset
        );
        vscode.window.activeTextEditor.selection = new vscode.Selection(p, p);
    }
}


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    var commands = [
        vscode.commands.registerCommand('coblock.line', coblockLine),
        vscode.commands.registerCommand('coblock.input', coblockInput),
    ];

    commands.forEach(function (command) {
        context.subscriptions.push(command);
    });
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}