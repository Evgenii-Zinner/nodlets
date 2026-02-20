import re

with open('public/game.js', 'r') as f:
    content = f.read()

# 1. Add attributes to new canvas in init()
init_pattern = r'(await this\.renderer\.init\(this\.container\);\s*)'
init_replacement = r'''\1
        // Accessibility for canvas
        const newCanvas = this.renderer.app.canvas;
        newCanvas.setAttribute('role', 'img');
        newCanvas.setAttribute('aria-label', 'Simulation Canvas');
'''
content = re.sub(init_pattern, init_replacement, content)

# 2. Update handleCanvasClick to handle misses
click_pattern = r'(if \(nearestIndex !== -1\) \{\s*this\.updateCreatureStatus\(nearestIndex\);\s*\})'
click_replacement = r'''\1 else {
            this.clearCreatureSelection();
        }'''
content = re.sub(click_pattern, click_replacement, content)

# 3. Add clearCreatureSelection method and update updateCreatureStatus visibility
# I'll insert clearCreatureSelection before updateCreatureStatus
status_method_start = r'(updateCreatureStatus\(creatureIndex\) \{)'
status_method_replacement = r'''clearCreatureSelection() {
        this.selectedCreatureIndex = -1;
        const empty = document.getElementById('creature-empty');
        const details = document.getElementById('creature-details');
        if (empty) empty.classList.remove('hidden');
        if (details) details.classList.add('hidden');
    }

    \1
        const empty = document.getElementById('creature-empty');
        const details = document.getElementById('creature-details');
        if (empty) empty.classList.add('hidden');
        if (details) details.classList.remove('hidden');
'''
content = re.sub(status_method_start, status_method_replacement, content)

with open('public/game.js', 'w') as f:
    f.write(content)
