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
    "cpp": {
        "start": "<#",
        "end": "#>"
    },
    "ruby": {
        "start": "=begin",
        "end": "=end"
    }
};

module.exports = {
    inlineCommentCharacters,
    blockCommentCharacters
}