import glob

for f in glob.glob('src/components/apps/*.tsx'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('className="h-full flex', 'className="absolute inset-0 flex')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
