import os

OUTPUT_FILE = "folder_tree.txt"

# Folders to ignore
IGNORE_FOLDERS = {
    ".git",
    "__pycache__",
    ".idea",
    "node_modules",
    ".vscode"
}

def generate_tree(folder, prefix=""):
    lines = []

    items = sorted(os.listdir(folder))

    # Remove ignored folders/files
    items = [item for item in items if item not in IGNORE_FOLDERS]

    for index, item in enumerate(items):
        path = os.path.join(folder, item)
        is_last = index == len(items) - 1

        connector = "└── " if is_last else "├── "
        lines.append(prefix + connector + item)

        if os.path.isdir(path):
            extension = "    " if is_last else "│   "
            lines.extend(generate_tree(path, prefix + extension))

    return lines


if __name__ == "__main__":
    start_folder = os.path.dirname(os.path.abspath(__file__))

    tree_lines = [os.path.basename(start_folder)]
    tree_lines.extend(generate_tree(start_folder))

    output_path = os.path.join(start_folder, OUTPUT_FILE)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(tree_lines))

    print(f"Folder tree saved to:\n{output_path}")