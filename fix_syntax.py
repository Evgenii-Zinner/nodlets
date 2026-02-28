with open('public/game.js', 'r') as f:
    content = f.read()

content = content.replace("    }\n    }\n\n    clearSelection()", "    }\n\n    clearSelection()")

with open('public/game.js', 'w') as f:
    f.write(content)
