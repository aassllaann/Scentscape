"""
按 topNotes / heartNotes / baseNotes 关键词，给每支香水重新打 subfamilyId。

分类逻辑：
  对每个大类，定义若干细分香调及其"关键词 + 权重"；
  把该香水所有 notes 与各细分的关键词做包含匹配，累加得分；
  得分最高的细分胜出；全部得分为 0 时使用该大类的默认值。

运行：
  python reclassify_subfamilies.py
输出：
  perfumes.json（原地修改）
  reclassify_report.txt（分类结果统计）
"""

import json
from collections import defaultdict

# ── 分类规则 ────────────────────────────────────────────────────────────────
# 结构：{ family: { subfamily_id: { weight: int, keywords: [str] } } }
#
# weight  表示该细分的"抢占强度"：
#   3 = 专属特征词（强烈指向该细分，优先抢占）
#   2 = 次级特征词
#   1 = 通用底色词（兜底，得分自然偏低）
#
# 每个 keyword 在 notes 中只要出现一次就计一次 weight 分（不重复累加）。

RULES: dict[str, dict[str, dict]] = {

    # ── 美食调 ──────────────────────────────────────────────────────────────
    "Gourmand": {
        "gourmand-spicy": {
            "weight": 3,
            "keywords": [
                "tobacco", "coffee", "cocoa", "dark chocolate", "chocolate",
                "rum", "whisky", "whiskey", "bourbon", "absinthe",
                "saffron", "cardamom", "cinnamon", "nutmeg", "clove",
                "black pepper", "pink pepper", "pepper", "incense", "smoke",
            ],
        },
        "gourmand-caramel": {
            "weight": 3,
            "keywords": [
                "caramel", "praline", "almond", "hazelnut", "marzipan",
                "nougat", "toffee", "sugar", "candy", "syrup",
                "fruit", "berry", "fig", "peach", "apricot",
                "plum", "cherry", "raspberry", "strawberry",
                "pear", "apple", "red fruits", "blackcurrant",
            ],
        },
        "gourmand-vanilla": {
            "weight": 1,   # 兜底：vanilla 覆盖面最广
            "keywords": [
                "vanilla", "vanilla bean", "tonka bean", "tonka",
                "benzoin", "heliotrope", "honey", "beeswax",
                "marshmallow", "cream", "milk", "coconut",
            ],
        },
    },

    # ── 东方调 ──────────────────────────────────────────────────────────────
    "Oriental": {
        "oriental-spicy": {
            "weight": 3,
            "keywords": [
                "oud", "agarwood", "myrrh", "frankincense", "incense",
                "olibanum", "smoke", "castoreum", "birch tar", "birch",
                "saffron", "clove", "cinnamon", "cardamom", "cumin",
                "pepper", "resin", "cistus", "labdanum",
            ],
        },
        "oriental-floral": {
            "weight": 3,
            "keywords": [
                "rose", "jasmine", "ylang ylang", "ylang-ylang",
                "tuberose", "orange blossom", "carnation",
                "narcissus", "osmanthus", "lily", "gardenia",
            ],
        },
        "oriental-vanilla": {
            "weight": 2,
            "keywords": [
                "vanilla", "vanilla bean", "tonka bean", "tonka",
                "honey", "caramel", "chocolate", "praline", "heliotrope",
            ],
        },
        "soft-oriental": {
            "weight": 1,   # 兜底：amber 基调
            "keywords": [
                "amber", "ambergris", "musk", "sandalwood",
                "benzoin", "balsam", "styrax", "vetiver",
            ],
        },
    },

    # ── 皮革调 ──────────────────────────────────────────────────────────────
    "Leather": {
        "tobacco-leather": {
            "weight": 3,
            "keywords": [
                "tobacco", "pipe tobacco", "virginia tobacco",
                "birch tar", "smoke", "birch", "tar", "rubber",
            ],
        },
        "leather-suede": {
            "weight": 3,
            "keywords": [
                "suede", "iris", "violet", "powder", "orris",
                "talc", "soft leather", "rose", "peach",
            ],
        },
        "leather-smoky": {
            "weight": 1,   # 兜底：黑暗烟熏皮革
            "keywords": [
                "leather", "incense", "castoreum", "oud", "saffron",
                "myrrh", "vetiver", "patchouli", "oakmoss",
            ],
        },
    },

    # ── 柑橘调 ──────────────────────────────────────────────────────────────
    "Citrus": {
        "citrus-aromatic": {
            "weight": 3,
            "keywords": [
                "lavender", "rosemary", "thyme", "sage", "basil",
                "tarragon", "oakmoss", "mint", "geranium", "petitgrain",
                "aromatic", "fougere", "herbs", "herb",
            ],
        },
        "citrus-floral": {
            "weight": 3,
            "keywords": [
                "jasmine", "rose", "orange blossom", "neroli",
                "ylang ylang", "violet", "peony", "iris",
                "lily", "magnolia", "tuberose", "freesia",
            ],
        },
        "hesperidic": {
            "weight": 1,   # 兜底：纯柑橘果实
            "keywords": [
                "bergamot", "grapefruit", "lemon", "lime",
                "mandarin", "yuzu", "orange", "tangerine",
                "citrus", "pomelo", "kumquat",
            ],
        },
    },

    # ── 花香调 ──────────────────────────────────────────────────────────────
    "Floral": {
        "floral-aldehyde": {
            "weight": 4,   # 醛香极具辨识度，一旦出现优先级最高
            "keywords": [
                "aldehyde", "aldehydes", "aldehydic",
            ],
        },
        "floral-oriental": {
            "weight": 3,
            "keywords": [
                "tuberose", "ylang ylang", "ylang-ylang", "gardenia",
                "jasmine", "amber", "oud", "vanilla", "sandalwood",
                "musk", "exotic", "indian jasmine",
            ],
        },
        "floral-fresh": {
            "weight": 2,
            "keywords": [
                "green notes", "citrus", "bergamot", "lemon",
                "galbanum", "lily of the valley", "muguet",
                "violet leaf", "apple", "pear", "tea", "green",
            ],
        },
        "floral-soft": {
            "weight": 1,   # 兜底：粉柔玫瑰
            "keywords": [
                "rose", "peony", "iris", "violet", "powder",
                "lily", "magnolia", "orchid", "freesia", "cyclamen",
                "white flowers",
            ],
        },
    },

    # ── 馥奇调 ──────────────────────────────────────────────────────────────
    "Fougere": {
        "classic-fougere": {
            "weight": 3,
            "keywords": [
                "oakmoss", "coumarin", "lavender", "geranium",
                "tonka", "tonka bean", "hay", "fern", "moss",
            ],
        },
        "fresh-fougere": {
            "weight": 3,
            "keywords": [
                "mint", "citrus", "bergamot", "grapefruit",
                "herbs", "rosemary", "thyme", "green", "galbanum",
                "petitgrain", "lime",
            ],
        },
        "soft-fougere": {
            "weight": 1,   # 兜底：柔美版
            "keywords": [
                "violet", "iris", "amber", "rose", "powder",
                "musk", "benzoin", "sandalwood", "saffron",
            ],
        },
    },

    # ── 水生调 ──────────────────────────────────────────────────────────────
    "Aquatic": {
        "aquatic-marine": {
            "weight": 4,   # 海洋特征词最稀缺，优先级最高
            "keywords": [
                "seaweed", "marine", "sea", "salt", "ocean",
                "aquatic", "kelp", "algae", "sea notes",
                "marine notes", "salt accord",
            ],
        },
        "aquatic-oceanic": {
            "weight": 2,
            "keywords": [
                "ambergris", "driftwood", "cedar", "cedarwood",
                "woody", "sandalwood", "vetiver", "oakmoss",
            ],
        },
        "aqua-fresh": {
            "weight": 1,   # 兜底：轻盈柑橘水生
            "keywords": [
                "bergamot", "lemon", "grapefruit", "lime",
                "citrus", "mandarin", "neroli", "petitgrain",
            ],
        },
    },

    # ── 木质调 ──────────────────────────────────────────────────────────────
    "Woody": {
        "sandalwood": {
            "weight": 4,
            "keywords": [
                "sandalwood", "australian sandalwood",
                "mysore sandalwood", "sandalwood accord",
            ],
        },
        "mossy-woods": {
            "weight": 3,
            "keywords": [
                "oakmoss", "moss", "fern", "patchouli",
                "labdanum", "chypre", "green",
            ],
        },
        "woody-aromatic": {
            "weight": 2,
            "keywords": [
                "lavender", "geranium", "mint", "rosemary",
                "herbs", "aromatic", "thyme", "sage", "juniper",
            ],
        },
        "dry-woods": {
            "weight": 1,   # 兜底：干燥雪松
            "keywords": [
                "cedar", "cedarwood", "vetiver", "ambroxan",
                "cashmeran", "birch", "wood", "woods", "cypriol",
            ],
        },
    },

    # ── 清新调 ──────────────────────────────────────────────────────────────
    "Fresh": {
        "fresh-aromatic": {
            "weight": 3,
            "keywords": [
                "rosemary", "mint", "thyme", "sage", "basil",
                "lavender", "herbs", "eucalyptus", "tea", "green tea",
            ],
        },
        "fresh-spice": {
            "weight": 3,
            "keywords": [
                "cardamom", "pepper", "black pepper", "pink pepper",
                "ginger", "coriander", "spice",
            ],
        },
        "fresh-green": {
            "weight": 1,   # 兜底
            "keywords": [
                "grass", "galbanum", "violet leaf", "fig leaf",
                "cucumber", "green", "bamboo", "apple", "pear",
                "citrus", "bergamot",
            ],
        },
    },
}

# 每个大类的默认细分（所有 notes 都没有命中时用）
DEFAULTS: dict[str, str] = {
    "Gourmand": "gourmand-vanilla",
    "Oriental":  "soft-oriental",
    "Leather":   "leather-smoky",
    "Citrus":    "hesperidic",
    "Floral":    "floral-soft",
    "Fougere":   "classic-fougere",
    "Aquatic":   "aqua-fresh",
    "Woody":     "dry-woods",
    "Fresh":     "fresh-green",
}


# ── 核心分类函数 ─────────────────────────────────────────────────────────────

def classify(perfume: dict) -> str:
    family = perfume.get("fragranceFamily", "")
    if family not in RULES:
        return perfume.get("subfamilyId", "")

    all_notes = (
        perfume.get("topNotes",   []) +
        perfume.get("heartNotes", []) +
        perfume.get("baseNotes",  [])
    )
    notes_lower = [n.lower() for n in all_notes]

    scores: dict[str, float] = {}
    for sub_id, rule in RULES[family].items():
        w = rule["weight"]
        score = 0.0
        for kw in rule["keywords"]:
            for note in notes_lower:
                if kw in note:
                    score += w
                    break   # 每个关键词只计一次分（避免同一 note 里重复）
        scores[sub_id] = score

    max_score = max(scores.values())
    if max_score == 0:
        return DEFAULTS.get(family, next(iter(RULES[family])))

    # 同分时按 weight 降序（倾向于具体细分而非兜底）
    return max(scores, key=lambda k: (scores[k], RULES[family][k]["weight"]))


# ── 主流程 ───────────────────────────────────────────────────────────────────

def main():
    data_path = "D:/香水网站/scentscape/data/perfumes.json"
    report_path = "D:/香水网站/scentscape/data/reclassify_report.txt"

    with open(data_path, encoding="utf-8") as f:
        perfumes = json.load(f)

    old_dist: dict[str, int] = defaultdict(int)
    new_dist: dict[str, int] = defaultdict(int)
    changed = 0

    for p in perfumes:
        old_id = p.get("subfamilyId", "")
        new_id = classify(p)
        old_dist[old_id] += 1
        new_dist[new_id] += 1
        if old_id != new_id:
            changed += 1
        p["subfamilyId"] = new_id

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(perfumes, f, ensure_ascii=False, indent=2)

    # 生成报告
    lines = [
        f"总香水数: {len(perfumes)}",
        f"subfamilyId 变更数: {changed}",
        "",
        "── 新分布 ────────────────────────────────",
    ]
    for sub_id, cnt in sorted(new_dist.items(), key=lambda x: -x[1]):
        lines.append(f"  {cnt:>5}  {sub_id}")
    lines += [
        "",
        "── 旧分布（对比）─────────────────────────",
    ]
    for sub_id, cnt in sorted(old_dist.items(), key=lambda x: -x[1]):
        lines.append(f"  {cnt:>5}  {sub_id}")

    report = "\n".join(lines)
    print(report)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n已写入 {data_path}")
    print(f"报告已写入 {report_path}")


if __name__ == "__main__":
    main()
