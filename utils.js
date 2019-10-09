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

    const conf = getConf();

    const startText = document.lineAt(selection.start).text.trim();

    const {
        commentCharacters
    } = getCommentCharacters(conf.preferBlockComment, document.languageId)

    const commentLine = commentCharacters.line;
    const blockStart = commentLine + conf.boxCharacter.repeat(conf.boxWidth) + " ".repeat(conf.spaceAround)
    const blockLineEnd = " ".repeat(conf.spaceAround) + conf.boxCharacter.repeat(conf.boxWidth)

    if (startText.startsWith(blockStart) && startText.endsWith(blockLineEnd)) {
        return true
    }

    const re = new RegExp(`^${commentLine}${conf.boxCharacter}+$`);
    if (re.exec(startText)) {
        let varText = startText;
        let i = 0;
        while (re.exec(varText)) {
            varText = document.lineAt(selection.start.line + i).text.trim();
            i += 1;
        }
        if (varText.startsWith(blockStart) && varText.endsWith(blockLineEnd)) {
            return true
        }
        varText = startText;
        i = 0;
        while (re.exec(varText)) {
            varText = document.lineAt(selection.start.line + i).text.trim();
            i -= 1;
        }
        if (varText.startsWith(blockStart) && varText.endsWith(blockLineEnd)) {
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
    if (preferBlockComment || !(languageId in languages.inlineCommentCharacters)) {
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

module.exports = {
    getCommentCharacters,
    getConf,
    isCoblock,
    getMaxLineLen,
    alignRight,
    alignLeft,
    center,
    isContentLine
}