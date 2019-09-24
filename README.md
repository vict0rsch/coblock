# Coblock: Creating a block of comment

The goal of this simple extension is to create comments that structure your code by describing what's in it:

```
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

You have 2 options:

* write "Start Loop" then `cmd/ctrl + shift + K`
  * this will transform the current line as above
  * `ctrl/cmd + shift + P` (command palette) then look for "Line to block comment"
* `ctrl/cmd + shift + P` (command palette) then look for "Block comment from input", then type in "Start Loop"
  * this will add the above snippet where your cursor currently is

If you're using the Python extension and have set pep8's `max-line-length` argument (88 for black formatter for instance), the extension will abide by it and break the comment into multiple lines before writing the block.
Otherwise it will use the standard max line length of 80.