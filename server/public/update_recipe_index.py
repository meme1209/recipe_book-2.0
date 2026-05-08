from pathlib import Path

BASE_DIR = Path(__file__).parent
RECIPES_DIR = BASE_DIR / "recipes"
OUTPUT_FILE = BASE_DIR / "js" / "recipe-data.js"


def prettify_name(filename):
    name = filename.replace(".html", "")
    name = name.replace("-", " ")
    return name


categories = []

for category_folder in sorted(RECIPES_DIR.iterdir()):

    if not category_folder.is_dir():
        continue

    category_name = category_folder.name

    recipe_list = []

    for recipe_file in sorted(category_folder.glob("*.html")):

        recipe_name = prettify_name(recipe_file.name)

        relative_url = f"recipes/{category_name}/{recipe_file.name}"

        recipe_list.append({
            "name": recipe_name,
            "url": relative_url
        })

    categories.append({
        "category": category_name,
        "recipes": recipe_list
    })


lines = []

lines.append("const recipeCategories = [")

for category in categories:

    lines.append("  {")
    lines.append(f'    category: "{category["category"]}",')
    lines.append("    recipes: [")

    for recipe in category["recipes"]:

        lines.append(
            f'      {{ name: "{recipe["name"]}", url: "{recipe["url"]}" }},'
        )

    lines.append("    ]")
    lines.append("  },")

lines.append("];")
lines.append("")
lines.append(
    "const recipes = recipeCategories.flatMap(category => category.recipes);"
)

OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")

print("recipe-data.js updated successfully.")