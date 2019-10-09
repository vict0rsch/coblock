const vscode = require('vscode');
const languages = require("./languages");
/**
 * @param {string} text
 * @param {string} blockLineStart
 * @param {string} blockLineEnd
 */
const isContentLine = (text, blockLineStart, blockLineEnd) => text.startsWith(blockLineStart) && text.endsWith(blockLineEnd)

/**
 * @param {string[]} contentLines
 * @param {number} [maxContentLength]
 */
const center = (contentLines, maxContentLength) => {
    /**
     * @param {string} line
     * @param {number} i
     */
    return contentLines.map(
        line => {
            const padLength = maxContentLength - line.length
            const before = " ".repeat(Math.floor(padLength / 2));
            const after = " ".repeat(Math.ceil(padLength / 2))
            return before + line + after
        }
    );
}

/**
 * @param {string[]} contentLines
 * @param {number} [maxContentLength]
 */
const alignLeft = (contentLines, maxContentLength) => {
    /**
     * @param {string} line
     * @param {number} i
     */
    return contentLines.map(
        line => line + " ".repeat(maxContentLength - line.length)
    );
}

/**
 * @param {string[]} contentLines
 * @param {number} [maxContentLength]
 */
const alignRight = (contentLines, maxContentLength) => {
    /**
     * @param {string} line
     * @param {number} i
     */
    return contentLines.map(
        line => " ".repeat(maxContentLength - line.length) + line
    );
}

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
 * @param {import("vscode").TextDocument} document
 * @param {import("vscode").Selection} selection
 */
const isCoblock = (document, selection) => {

    console.log("z");

    const conf = getConf();
    console.log("y");
    const startText = document.lineAt(selection.start).text.trim();
    console.log("y");
    const {
        commentCharacters
    } = getCommentCharacters(conf.preferBlockComment, document.languageId)
    console.log("y");
    const commentLine = commentCharacters.line;
    const blockLineStart = commentLine + conf.boxCharacter.repeat(conf.boxWidth)
    const blockLineEnd = conf.boxCharacter.repeat(conf.boxWidth)
    console.log("y");
    if (isContentLine(startText, blockLineStart, blockLineEnd)) {
        return true;
    }
    console.log("y");
    const re = new RegExp(`^${commentLine}${conf.boxCharacter}+$`);
    if (re.exec(startText)) {
        let varText = startText;
        let i = 0;
        while (re.exec(varText)) {
            varText = document.lineAt(selection.start.line + i).text.trim();
            i += 1;
        }
        if (isContentLine(varText, blockLineStart, blockLineEnd)) {
            return true
        }
        varText = startText;
        i = 0;
        while (re.exec(varText)) {
            varText = document.lineAt(selection.start.line + i).text.trim();
            i -= 1;
        }
        if (isContentLine(varText, blockLineStart, blockLineEnd)) {
            return true
        }
    }
    return false
}

const getConf = () => {
    const coblockConf = vscode.workspace.getConfiguration('coblock');
    let {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight,
        preferBlockComment,
        layout
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
    if (['left', 'center', 'right'].indexOf(layout) === -1) {
        layout = "left";
    }

    return {
        boxCharacter,
        spaceAround,
        numBlankLines,
        boxWidth,
        boxHeight,
        preferBlockComment,
        layout
    };
}


/**
 * @param {boolean} preferBlockComment
 * @param {string} languageId
 */
const getCommentCharacters = (preferBlockComment, languageId) => {
    let commentCharacters, isBlockComment;
    if ((preferBlockComment && languageId in languages.blockCommentCharacters) || !(languageId in languages.inlineCommentCharacters)) {
        commentCharacters = languages.blockCommentCharacters[languageId];
        commentCharacters["line"] = "";
        isBlockComment = true;
    }
    if (!commentCharacters) {
        commentCharacters = {
            "start": languages.inlineCommentCharacters[languageId],
            "end": ""
        };
        commentCharacters["line"] = commentCharacters.start + " ";
        isBlockComment = false;
    }
    if (!commentCharacters.start) throw "Unknown languageId: " + languageId;
    return {
        isBlockComment,
        commentCharacters
    }
}

/**
 * @param {string} text
 * @param {number} N
 */
const removeOverNSpaces = (text, N) => {
    return text.split("\n").map(c => {
        if (countLeadingSpaces(c) >= N) {
            c = c.slice(N)
        }
        return c
    }).join("\n")
}

const removeIndentation = text => {
    const minSpaces = text.split("\n").map(c => countLeadingSpaces(c)).reduce((a, b) => a < b ? a : b);
    return removeOverNSpaces(text, minSpaces)
}

/**
 * @param {string} str
 */
const countLeadingSpaces = str => str.replace(/^(\s*).*$/, "$1").length

/**
 * @param {string} text
 */
const getMinLeadingSpaces = text => {
    return text.split("\n").map(countLeadingSpaces).reduce((a, b) => a < b ? a : b)
}

const getFirstLeadingSpaces = text => {
    return countLeadingSpaces(text.split("\n").filter(c => c.trim().length)[0])
}

module.exports = {
    getCommentCharacters,
    getConf,
    isCoblock,
    getMaxLineLen,
    alignRight,
    alignLeft,
    center,
    isContentLine,
    removeOverNSpaces,
    removeIndentation,
    getMinLeadingSpaces,
    getFirstLeadingSpaces,
    countLeadingSpaces
}