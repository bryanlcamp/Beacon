#!/usr/bin/env python3
import re

def check_html_errors(filename):
    with open(filename, 'r') as f:
        content = f.read()

    print('=== CHECKING FOR HTML VALIDATION ERRORS ===')
    errors = []

    # 1. Check for duplicate IDs
    id_pattern = r'id=["\']([^"\']+)["\']'
    seen_ids = set()
    for line_num, line in enumerate(content.split('\n'), 1):
        for match in re.finditer(id_pattern, line):
            id_val = match.group(1)
            if id_val in seen_ids:
                errors.append(f'Line {line_num}: Duplicate ID "{id_val}"')
            seen_ids.add(id_val)

    # 2. Check for missing closing tags for divs
    div_opens = len(re.findall(r'<div[^>]*>', content))
    div_closes = len(re.findall(r'</div>', content))
    if div_opens != div_closes:
        errors.append(f'Div mismatch: {div_opens} opening <div> tags, {div_closes} closing </div> tags')

    # 3. Check for missing closing tags for other elements
    for tag in ['section', 'main', 'header', 'nav', 'button', 'span', 'a']:
        opens = len(re.findall(f'<{tag}[^>]*(?<!/)', content))
        closes = len(re.findall(f'</{tag}>', content))
        if opens != closes:
            errors.append(f'{tag.capitalize()} mismatch: {opens} opening <{tag}> tags, {closes} closing </{tag}> tags')

    # 4. Check for invalid attributes
    invalid_attrs = re.findall(r'onclick="[^"]*"[^"]*"[^"]*"', content)
    if invalid_attrs:
        errors.append(f'Found {len(invalid_attrs)} malformed onclick attributes with quote issues')

    # 5. Check for unclosed script/style tags
    script_opens = len(re.findall(r'<script[^>]*>', content))
    script_closes = len(re.findall(r'</script>', content))
    if script_opens != script_closes:
        errors.append(f'Script mismatch: {script_opens} opening <script> tags, {script_closes} closing </script> tags')

    style_opens = len(re.findall(r'<style[^>]*>', content))
    style_closes = len(re.findall(r'</style>', content))
    if style_opens != style_closes:
        errors.append(f'Style mismatch: {style_opens} opening <style> tags, {style_closes} closing </style> tags')

    # Print results
    if errors:
        print(f'Found {len(errors)} HTML validation errors:')
        for i, error in enumerate(errors, 1):
            print(f'{i}. {error}')
    else:
        print('No major HTML validation errors found')

if __name__ == '__main__':
    check_html_errors('index.html')
