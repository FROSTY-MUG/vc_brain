import glob
import os

for f in glob.glob('src/components/apps/*.tsx'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Fix AgentHubApp which uses Scroller explicitly
    content = content.replace('<Scroller className="flex-1 p-4">', '<Scroller className="flex-1 min-h-0 p-4">')
    
    # Fix all other apps using native flex-1 overflow-y-auto
    content = content.replace('className="flex-1 overflow-y-auto', 'className="flex-1 min-h-0 overflow-y-auto')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
