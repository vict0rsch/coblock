// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const utils = require("./utils");

/**
 * @param {import("vscode").TextDocument} document
 * @param {import("vscode").Selection} selection
 */
const getExistingBlockContent = (document, selection) => {
    const conf = utils.getConf();
    const {
        isBlockComment,
        commentCharacters
    } = utils.getCommentCharacters(conf.preferBlockComment, document.languageId)
    const commentLine = commentCharacters.line;

    const startText = document.lineAt(selection.start).text.trim();
    const blockLineStart = commentLine + conf.boxCharacter.repeat(conf.boxWidth);
    const blockLineEnd = conf.boxCharacter.repeat(conf.boxWidth);
    const reBorderLine = new RegExp(`^${commentLine}${conf.boxCharacter}+$`);

    let i = selection.start.line;
    let varText = startText;
    while (utils.isContentLine(varText, blockLineStart, blockLineEnd) || reBorderLine.exec(varText)) {
        i -= 1;
        varText = document.lineAt(i).text.trim();
    }
    i += 1;
    let blockStartIndex = i;
    varText = document.lineAt(i).text.trim();
    let contentLines = [];
    let contentStartIndex = -1;
    let contentEndIndex = -1;
    while (utils.isContentLine(varText, blockLineStart, blockLineEnd) || reBorderLine.exec(varText)) {

        if (contentStartIndex < 0 && utils.isContentLine(varText, blockLineStart, blockLineEnd) && !reBorderLine.exec(varText)) {
            contentStartIndex = i;
        }
        if (contentStartIndex > 0 && contentEndIndex < 0 && reBorderLine.exec(varText)) {
            contentEndIndex = i;
        }
        contentLines.push(varText);
        i += 1;
        varText = document.lineAt(i).text.trim();
    }
    let blockEndIndex = i;
    const inputArray = document.getText().split("\n").slice(contentStartIndex, contentEndIndex).filter(c => c)
    const indentationSize = utils.getMinLeadingSpaces(inputArray.join("\n"));
    const input = inputArray.map(
        c => {
            c = c.trimLeft().replace(blockLineStart, "").replace(blockLineEnd, "").replace("\n", "")
            if (utils.countLeadingSpaces(c) >= conf.spaceAround) {
                c = c.slice(conf.spaceAround);
            }
            return c
        }
    ).join("\n")

    if (isBlockComment) {
        blockStartIndex -= 1;
        blockEndIndex += 1;
    }

    return {
        input,
        blockStartIndex,
        blockEndIndex,
        indentationSize
    }
}

/**
 * @param {string} inputText
 * @param {number} maxContentLen
 * @param {string} indentation
 * @param {string} commentLine
 * @param {string} separator
 * @param {string} spaces
 * @param {string} layout
 */
const getMultilineContent = (inputText, maxContentLen, indentation, commentLine, separator, spaces, layout) => {
    // inputText is too long or contains multiple lines
    // Treat each line independently, split it on spaces
    // create as many lines as necessary, no longer than maxLineLen

    let inputLines = inputText.split("\n");
    const spacesToRemove = inputLines.map(utils.countLeadingSpaces).reduce((a, b) => a < b ? a : b);
    inputLines = inputLines.map(l => {
        if (utils.countLeadingSpaces(l) >= spacesToRemove) {
            l = l.slice(spacesToRemove);
        }
        return l
    })
    let currentMaxContentLength = 0;
    let contentLines = [];

    for (const inputLine of inputLines) {

        let words = inputLine.trimRight().split(" ").reverse();
        let contentLine = "";
        let stopLine = false;
        let wordCount = 0;

        while (words.length > 0) {
            let word = words.pop();
            // if (!word) continue;
            stopLine = false
            const newLineLength = contentLine.length + word.length + 1;
            if (newLineLength <= maxContentLen) {
                contentLine += wordCount ? " " + word.replace("\n", "") : word.replace("\n", "");
                if (word.indexOf("\n") > -1) {
                    stopLine = true;
                    word = "";
                }
            } else {
                stopLine = true;
            }
            if (stopLine) {
                contentLine = contentLine;
                contentLines.push(contentLine);
                if (contentLine.length > currentMaxContentLength) {
                    currentMaxContentLength = contentLine.length;
                }
                // If stopLine comes from contentLine being too long,
                // new contentLine should start with the word that caused
                // stopLine because it was not added
                // Otherwise it comes from word containing \n and was therefore
                // already added to the current contentLine
                contentLine = word ? word.replace("\n", "") : "";
                wordCount = word ? 1 : 0;
            } else {
                wordCount += 1;
            }
        }
        // Store last line
        if (contentLine) {
            contentLine = contentLine;
            contentLines.push(contentLine);
            if (contentLine.length > currentMaxContentLength) {
                currentMaxContentLength = contentLine.length;
            }
        }
    }
    // Increase total block line count

    // Padd lines
    // (may raise "invalid count value" if there was an error computing currentMaxContentLength)
    const paddedContentLines = layout === "center" ?
        utils.center(contentLines, currentMaxContentLength) :
        layout === "right" ?
        utils.alignRight(contentLines, currentMaxContentLength) :
        utils.alignLeft(contentLines, currentMaxContentLength);

    return {
        content:
            /**
             * @param {string} line
             * @param {number} i
             */
            paddedContentLines.map(
                (line, i) => indentation + commentLine + separator + spaces + line + spaces + separator
            ).join("\n") + "\n",
        linesCount: contentLines.length,
        maxContentLength: currentMaxContentLength
    }
}


/**
 * @param {string} inputText
 * @param {number} _offsetCount
 * @param {string} languageId
 */
const getBlock = (inputText, _offsetCount, languageId) => {

    // ---------------------------
    // -----    Variables    -----
    // ---------------------------
    const {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight,
        preferBlockComment,
        layout,
        maxLineLength
    } = utils.getConf();
    let content, cursorOffset, maxContentLength;
    const indentationSize = _offsetCount || 0;
    const indentation = " ".repeat(indentationSize);
    let linesCount = 2 * (boxHeight + numBlankLines);


    // ------------------------------------
    // -----    Set Comment Params    -----
    // ------------------------------------

    const {
        isBlockComment,
        commentCharacters
    } = utils.getCommentCharacters(preferBlockComment, languageId)
    const commentStart = commentCharacters.start;
    const commentEnd = commentCharacters.end;
    const commentLine = commentCharacters.line;

    // remove left indentation (= indentation)
    // remove the left and right width and spaces arount the content
    // remove 2 for commentStart at the beginning of the line
    const maxContentLen = maxLineLength - indentationSize - 2 * (boxWidth + spaceAround) - commentStart.length;

    // vertical border
    const separator = boxCharacter.repeat(boxWidth);
    // spaces between vertical border and content
    const spaces = " ".repeat(spaceAround);


    // ------------------------------------------------------------------------
    // -----   Infer content, linesCount and maxContentLen depending on   -----
    // -----   whether or not the input text is on multiple line or not   -----
    // ------------------------------------------------------------------------
    if (
        (maxLineLength > 0 && inputText.length > maxContentLen) ||
        inputText.indexOf("\n") > -1
    ) {
        const multilineContent = getMultilineContent(
            inputText,
            maxContentLen,
            indentation,
            commentLine,
            separator,
            spaces,
            layout
        );
        content = multilineContent.content;
        linesCount += multilineContent.linesCount;
        maxContentLength = multilineContent.maxContentLength;
    } else {
        // inputText is not too long nor is it multiline
        content = indentation + commentLine + separator + spaces + inputText.trim() + spaces + separator + "\n";
        maxContentLength = inputText.trim().length;
        linesCount += 1;
    }

    // ---------------------------------------------------------
    // -----   Create Block from content and User config   -----
    // ---------------------------------------------------------

    const blockWidth = maxContentLength + 2 * (spaceAround + boxWidth);
    const blankLines = (indentation + commentLine + separator + spaces + " ".repeat(maxContentLength) + spaces + separator + "\n").repeat(numBlankLines);
    let topBorder = (indentation + commentLine + boxCharacter.repeat(blockWidth) + "\n").repeat(boxHeight);
    let bottomBorder = (indentation + commentLine + boxCharacter.repeat(blockWidth) + "\n").repeat(boxHeight);

    cursorOffset = topBorder.split('\n')[0].length;
    if (isBlockComment) {
        topBorder = indentation + commentStart + "\n" + topBorder;
        bottomBorder = bottomBorder + indentation + commentEnd + "\n";
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

// ----------------------------------------------
// -----   Use CoBlock from palette input   -----
// -----   May become deprecated            -----
// ----------------------------------------------

async function coblockInput() {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    const input = await vscode.window.showInputBox();

    let editor = vscode.window.activeTextEditor;
    const languageId = editor.document.languageId;

    if (editor) {
        let start = editor.selection.start;
        const {
            block,
            linesCount,
            cursorOffset
        } = getBlock(
            input,
            start.character,
            languageId,
        );
        editor.edit(editBuilder => {
            editBuilder.insert(start, block);
        });
    }
}

// ---------------------------------------------
// -----   Main function used in CoBlock   -----
// ---------------------------------------------

function coblockLine() {

    // The code you place here will be executed every time your command is executed

    // Display a message box to the user


    let editor = vscode.window.activeTextEditor;
    let input, startLine, endLine, indentationSize;

    const languageId = editor.document.languageId;

    if (editor) {

        const document = editor.document;
        const selection = editor.selection;
        let rangeStartLine, rangeEndLine
        if (utils.isCoblock(document, selection)) {
            // console.log("Updating CoBlock");
            const existingContent = getExistingBlockContent(document, selection);
            // console.log("Existing content:");
            // console.log(existingContent);
            input = existingContent.input;
            rangeStartLine = existingContent.blockStartIndex;
            rangeEndLine = existingContent.blockEndIndex;
            indentationSize = existingContent.indentationSize
            startLine = document.lineAt(rangeStartLine);
        } else {
            // console.log('Creating CoBlock:');
            rangeStartLine = selection.start.line;
            rangeEndLine = selection.end.line + 1;
            if (selection.start.line !== selection.end.line) {
                // multiline selection
                startLine = document.lineAt(selection.start.line);
                endLine = document.lineAt(selection.end.line);
                input = document.getText(new vscode.Range(
                    selection.start.line,
                    0,
                    selection.end.line,
                    endLine.text.length
                ));
            } else {
                // single line selection
                const start = selection.start;
                startLine = document.lineAt(start.line);
                endLine = document.lineAt(start.line);
                input = startLine.text.trimRight();
            }
            // console.log(input);
            indentationSize = utils.getFirstLeadingSpaces(input);
            input = utils.removeIndentation(input);
            // console.log(input);
            // console.log(startLine);
            // console.log(endLine);
        }

        // console.log(input);

        const {
            block,
            linesCount,
            cursorOffset
        } = getBlock(
            input,
            indentationSize,
            languageId,
        );

        // replace document content with comment block
        editor.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(rangeStartLine, 0, rangeEndLine, 0), block);
        });

        // position cursor at the end of the added comment block
        const p = new vscode.Position(
            rangeStartLine + linesCount - 1,
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