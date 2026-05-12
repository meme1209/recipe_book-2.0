from pathlib import Path

ROOT = Path(__file__).parent

# -----------------------------------------
# Find all recipe html files
# -----------------------------------------

html_files = list(
    ROOT.rglob("*.html")
)

updated_count = 0

for file_path in html_files:

    # Skip index or non-recipe pages

    if file_path.name.lower() in [
        "index.html",
        "license.html",
        "admin.html"
    ]:
        continue

    try:

        content = file_path.read_text(
            encoding="utf-8"
        )

        original = content

        # ---------------------------------
        # Add rating container
        # ---------------------------------

        if (
            '<div class="recipe-rating"></div>'
            not in content
        ):

            nav_end = '</nav>'

            if nav_end in content:

                content = content.replace(
                    nav_end,
                    nav_end +
                    '\n\n  <div class="recipe-rating"></div>',
                    1
                )

        # ---------------------------------
        # Add ratings.js
        # ---------------------------------

        if (
            'ratings.js'
            not in content
        ):

            script_tag = (
                '\n  <script src="../../js/ratings.js"></script>'
            )

            if '</body>' in content:

                content = content.replace(
                    '</body>',
                    script_tag +
                    '\n\n</body>',
                    1
                )

        # ---------------------------------
        # Save only if changed
        # ---------------------------------

        if content != original:

            file_path.write_text(
                content,
                encoding="utf-8"
            )

            print(
                f'Updated: {file_path.name}'
            )

            updated_count += 1

    except Exception as e:

        print(
            f'ERROR: {file_path.name}'
        )

        print(e)

print()
print('======================')
print(
    f'Updated {updated_count} recipe files.'
)
print('======================')