import re

with open('public/index.html', 'r') as f:
    content = f.read()

# Add ARIA labels to zoom buttons
content = content.replace('<button id="zoomIn" title="Zoom In">', '<button id="zoomIn" title="Zoom In" aria-label="Zoom In">')
content = content.replace('<button id="zoomOut" title="Zoom Out">', '<button id="zoomOut" title="Zoom Out" aria-label="Zoom Out">')
content = content.replace('<button id="resetZoom" title="Reset">', '<button id="resetZoom" title="Reset" aria-label="Reset Zoom">')

# Replace status panel content
status_panel_pattern = re.compile(r'(<div class="status-panel">)(\s*<div class="status-header">Selected Creature</div>)(.*?)(</div>\s*<div class="population-panel">)', re.DOTALL)

new_status_content = r'''\1\2
                <div id="creature-empty" style="font-style: italic; color: #888; padding: 10px; text-align: center;">Select a creature to inspect</div>
                <div id="creature-details" class="hidden" style="display: flex; flex-direction: column; gap: 8px;">\3
                </div>\4'''

content = status_panel_pattern.sub(new_status_content, content)

with open('public/index.html', 'w') as f:
    f.write(content)
