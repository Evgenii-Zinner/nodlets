import re

with open('public/index.html', 'r') as f:
    content = f.read()

# Replace the two population-panel divs with a new bottom bar layout
old_stats = """            <div class="population-panel">
                Nodlets: <span id="creatureCount">0</span>
            </div>
            <div class="population-panel" style="margin-top: 10px;">
                Data Harvested: <span id="totalDataConsumed" style="color: var(--accent-color);">0</span>
            </div>"""

new_stats = ""
content = content.replace(old_stats, new_stats)

bottom_bar = """        <div class="stats-bottom-bar">
            <div class="stat-item">Nodlets: <span id="creatureCount">0</span></div>
            <div class="stat-item">Data Harvested: <span id="totalDataConsumed" style="color: var(--accent-color);">0</span></div>
        </div>"""

content = content.replace('        <canvas id="gameCanvas"></canvas>', bottom_bar + '\n        <canvas id="gameCanvas"></canvas>')

with open('public/index.html', 'w') as f:
    f.write(content)
