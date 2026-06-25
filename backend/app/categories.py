from typing import TypedDict


class Category(TypedDict):
    slug: str
    label: str
    emoji: str
    suggested_units: list[str]


CATEGORIES: list[Category] = [
    {
        "slug": "vegetables",
        "label": "Vegetables",
        "emoji": "🥦",
        "suggested_units": ["pieces", "g", "kg"],
    },
    {"slug": "fruits", "label": "Fruits", "emoji": "🍎", "suggested_units": ["pieces", "g", "kg"]},
    {
        "slug": "dairy",
        "label": "Dairy",
        "emoji": "🧀",
        "suggested_units": ["pieces", "g", "ml", "L"],
    },
    {"slug": "meat", "label": "Meat", "emoji": "🥩", "suggested_units": ["g", "kg", "pieces"]},
    {"slug": "fish", "label": "Fish", "emoji": "🐟", "suggested_units": ["g", "kg", "pieces"]},
    {
        "slug": "leftovers",
        "label": "Leftovers",
        "emoji": "🍱",
        "suggested_units": ["portions", "g"],
    },
    {
        "slug": "condiments",
        "label": "Condiments",
        "emoji": "🫙",
        "suggested_units": ["pieces", "ml", "g"],
    },
    {"slug": "drinks", "label": "Drinks", "emoji": "🧃", "suggested_units": ["bottles", "L", "ml"]},
    {"slug": "frozen", "label": "Frozen", "emoji": "🧊", "suggested_units": ["pieces", "g", "kg"]},
    {"slug": "grains", "label": "Grains", "emoji": "🌾", "suggested_units": ["g", "kg", "pieces"]},
    {"slug": "other", "label": "Other", "emoji": "📦", "suggested_units": ["pieces", "g", "ml"]},
]

CATEGORY_SLUGS = {c["slug"] for c in CATEGORIES}
