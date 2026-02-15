import os
import json
from bs4 import BeautifulSoup

# Directory containing your HTML files (relative to this script)
HTML_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
ASSETS_DIR = os.path.join(HTML_ROOT, 'assets')
OUTPUT_PATH = os.path.join(ASSETS_DIR, 'search-index.json')

# Folders to scan for HTML files (relative to HTML_ROOT)
SCAN_FOLDERS = [
    '.',
    'command-center',
    'command-center/overview',
    'about.html',
    'command-center/apps',
    'web',
]

def extract_info_from_html(filepath, relpath):
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
        title = soup.title.string.strip() if soup.title and soup.title.string else os.path.basename(filepath)
        # Try to get a meta description or the first paragraph as a snippet
        desc = ''
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            desc = meta['content'].strip()
        else:
            p = soup.find('p')
            if p:
                desc = p.get_text(strip=True)
        # Get all text for searching
        content = soup.get_text(separator=' ', strip=True)
        return {
            'title': title,
            'url': relpath.replace(HTML_ROOT, '').replace(os.sep, '/'),
            'snippet': desc,
            'content': content
        }

def scan_html_files():
    index = []
    for folder in SCAN_FOLDERS:
        abs_folder = os.path.join(HTML_ROOT, folder)
        if os.path.isfile(abs_folder) and abs_folder.endswith('.html'):
            relpath = os.path.relpath(abs_folder, HTML_ROOT)
            index.append(extract_info_from_html(abs_folder, relpath))
        elif os.path.isdir(abs_folder):
            for root, _, files in os.walk(abs_folder):
                for file in files:
                    if file.endswith('.html'):
                        filepath = os.path.join(root, file)
                        relpath = os.path.relpath(filepath, HTML_ROOT)
                        index.append(extract_info_from_html(filepath, relpath))
    return index

def main():
    index = scan_html_files()
    os.makedirs(ASSETS_DIR, exist_ok=True)
    print(f"DEBUG: Will write search index to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Search index written to {OUTPUT_PATH} ({len(index)} pages indexed)")

if __name__ == '__main__':
    main()
