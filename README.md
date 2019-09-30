<p align="center">
<img src="https://i.postimg.cc/RFzdtfsv/Capture-d-e-cran-2019-09-26-a-08-36-20.png" height="300" width="400" center />
</p>

# CoBlock: Creating a comment block 📦

📌 The goal of this simple extension is to create comments that structure your code by describing what's in it:

![usageGif](https://s3.gifyu.com/images/ezgif.com-resize-15da7ed4f4f79417c.gif)

## Usage 💡

```python
for i in range(n):
    # ----------------------
    # ----- Start loop -----
    # ----------------------
    dosomething()

    dosomethingelse()

    # -----------------------
    # ----- End of loop -----
    # -----------------------

# -----------------------------
# ----- Do Something Else -----
# -----------------------------
```

You have 2️⃣ options:

* write "Start Loop" then `cmd/ctrl + shift + K` 🔆
  * this will transform the current line into a block comment, as above
  * `ctrl/cmd + shift + P` (command palette) then look for "Line to block comment"
* `ctrl/cmd + shift + P` (command palette) then look for "Block comment from input", then type in "Start Loop" 💬
  * this will add the above same kind of comment block where your cursor currently is

✂️ If you're using the Python 🐍 extension and have set pep8's `max-line-length` argument (88 for Black ◾️ formatter for instance), the extension will abide by it and break the comment into multiple lines before writing the block.
Otherwise it will use the standard max line length of 79.

### Configuration ⚙️

You can customize 🖌

* the character that draws the box (default: `-`) 
* the number of spaces around your text in the box (default: `1`)
* the number of blank lines between your text and the box's border (default: `0`)
* the height and width of the box's border (default: `1` and `5`)
* prefer block over inline syntax for comments when applicable (`c`, `c++`, `java`, `javascript`, `php`, `ruby`, `rust`, `scala`)

For intance with **this configuration**:

![config image](https://i.postimg.cc/kG4zPhG4/Capture-d-e-cran-2019-09-26-a-00-44-01.png)

You'll get **this kind of output**:

![long comment](https://i.postimg.cc/V6sHXHjR/Capture-d-e-cran-2019-09-26-a-00-42-54.png)

|                          preferBlockComments: `true`                          |                          preferBlockComments: `true`                          |
| :---------------------------------------------------------------------------: | :---------------------------------------------------------------------------: |
| ![](https://i.postimg.cc/hjCckZGs/Capture-d-e-cran-2019-09-29-a-23-40-10.png) | ![](https://i.postimg.cc/KzshqK9s/Capture-d-e-cran-2019-09-29-a-23-39-57.png) |


### Supported Languages 📟

**CoBlock** is available when working with these languages:

* bat
* c
* c++
* clojure
* coffeescript
* csharp
* css
* dockerfile
* go
* html
* java
* javascript
* javascriptreact
* jsonc
* latex
* less
* lua
* makefile
* matlab
* objective-c
* objective-cpp
* perl
* php
* powershell
* properties
* python
* r
* ruby
* rust
* scala
* shellscrip
* sql
* ssh_config
* swift
* xml
* yaml

### Disclaimer

This is my first VSCode extension. Things may not be optimimal. 

I'm open to help for improvements! Use **PRs** and **issues** 📣 to help or suggest the addition of a language, different comment styles etc.
