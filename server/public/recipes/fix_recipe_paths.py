from pathlib import Path
import re

BASE_DIR = Path(__file__).parent


def fix_paths(html):

    # Fix CSS path
    html = re.sub(
        r'href="\.\./css/style\.css"',
        'href="../../css/style.css"',
        html
    )

    # Fix index link
    html = re.sub(
        r'href="\.\./index\.html"',
        'href="../../index.html"',
        html
    )

    # Fix JS path
    html = re.sub(
        r'src="\.\./js/recipe-edit\.js"',
        'src="../../js/recipe-edit.js"',
        html
    )

    return html


def ensure_editor_comment(html):

    comment = "<!-- recipe editor toolbar will be injected here by JS -->"

    if comment not in html:

        html = html.replace(
            "</nav>",
            f"</nav>\n    {comment}"
        )

    return html


fixed_count = 0

for html_file in BASE_DIR.rglob("*.html"):

    try:

        content = html_file.read_text(encoding="utf-8")

        original_content = content

        content = fix_paths(content)
        content = ensure_editor_comment(content)

        if content != original_content:

            html_file.write_text(content, encoding="utf-8")

            print(f"Fixed: {html_file.name}")

            fixed_count += 1

    except Exception as e:

        print(f"ERROR: {html_file}")
        print(e)

print()
print(f"Finished. Fixed {fixed_count} recipe files.")