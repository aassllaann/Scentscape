"""
将 perfume_database.xlsx 转换为 perfumes.json。

分类逻辑：
  fragranceFamily —— 对每个香水，按 main_accords 与各大类权重表打分，最高分胜出。
                      第一个 accord（主导香调）享有 3× 加权。
  subfamilyId    —— 在已确定大类内，再次按 accord 权重表做二次打分。
  intensityCurve —— 由 longevity / sillage 投票数据推算5点强度曲线。
  moodTags/Scores—— 从 accord 标签推导。
  gender         —— 由 accord 标签推断 masculine / feminine / unisex。

运行：
  python convert_excel.py
"""

import json, re, math
from collections import defaultdict
import openpyxl

# ── 常量 ────────────────────────────────────────────────────────────────────

EXCEL_PATH  = "D:/香水网站/scentscape/data/perfume_database.xlsx"
OUTPUT_PATH = "D:/香水网站/scentscape/data/perfumes.json"
FAMILY_MAP_PATH = "D:/香水网站/scentscape/data/familyMap.json"

# ── fragranceFamily 评分表 ───────────────────────────────────────────────────
# { accord: { family: weight } }
# 第一个 accord 的 weight 再乘以 FIRST_MULTIPLIER
FIRST_MULTIPLIER = 3

FAMILY_WEIGHTS: dict[str, dict[str, float]] = {
    # ── Floral ────────────────────────────────────────────────────────────
    "floral":       {"Floral": 4},
    "white floral": {"Floral": 4},
    "rose":         {"Floral": 3},
    "yellow floral":{"Floral": 3},
    "tuberose":     {"Floral": 4},
    "aldehydic":    {"Floral": 3},
    "powdery":      {"Floral": 1},          # 也出现在 Oriental/Gourmand，权重低

    # ── Woody ─────────────────────────────────────────────────────────────
    "woody":        {"Woody": 3},
    "patchouli":    {"Woody": 3},
    "earthy":       {"Woody": 3},
    "mossy":        {"Woody": 3},
    "conifer":      {"Woody": 2},

    # ── Fougere ───────────────────────────────────────────────────────────
    "aromatic":     {"Fougere": 3},
    "herbal":       {"Fougere": 3},
    "fresh spicy":  {"Fougere": 2, "Citrus": 1},   # 馥奇/柑橘共享

    # ── Leather ───────────────────────────────────────────────────────────
    "leather":      {"Leather": 5},
    "smoky":        {"Leather": 3},
    "tobacco":      {"Leather": 3},

    # ── Gourmand ──────────────────────────────────────────────────────────
    "sweet":        {"Gourmand": 2},
    "vanilla":      {"Gourmand": 3},
    "gourmand":     {"Gourmand": 5},
    "caramel":      {"Gourmand": 3},
    "honey":        {"Gourmand": 2},
    "cacao":        {"Gourmand": 3},
    "coffee":       {"Gourmand": 3},
    "almond":       {"Gourmand": 2},
    "rum":          {"Gourmand": 3},
    "whiskey":      {"Gourmand": 3},
    "coconut":      {"Gourmand": 2},
    "milky":        {"Gourmand": 2},
    "nutty":        {"Gourmand": 2},
    "lactonic":     {"Gourmand": 3},
    "beeswax":      {"Gourmand": 2},
    "fruity":       {"Gourmand": 1, "Floral": 1},  # 果香偏甜/花，权重低
    "cherry":       {"Gourmand": 2},
    "wine":         {"Gourmand": 2},
    "tropical":     {"Gourmand": 1, "Fresh": 1},

    # ── Citrus ────────────────────────────────────────────────────────────
    "citrus":       {"Citrus": 4},

    # ── Fresh ─────────────────────────────────────────────────────────────
    "fresh":        {"Fresh": 3},
    "green":        {"Fresh": 2},
    "ozonic":       {"Fresh": 2, "Aquatic": 1},
    "terpenic":     {"Fresh": 2},

    # ── Aquatic ───────────────────────────────────────────────────────────
    "aquatic":      {"Aquatic": 5},
    "marine":       {"Aquatic": 5},
    "watery":       {"Aquatic": 4},
    "salty":        {"Aquatic": 3},

    # ── Oriental ──────────────────────────────────────────────────────────
    "amber":        {"Oriental": 3},
    "balsamic":     {"Oriental": 3},
    "warm spicy":   {"Oriental": 3},
    "oud":          {"Oriental": 5},
    "soft spicy":   {"Oriental": 2},
    "animalic":     {"Oriental": 3},
    "cinnamon":     {"Oriental": 2},
}

FAMILY_DEFAULT = "Woody"

# ── subfamilyId 评分表 ────────────────────────────────────────────────────────
# { family: { subfamily: { accords: [str], weight: int } } }
SUBFAMILY_WEIGHTS: dict[str, dict[str, dict]] = {
    "Floral": {
        "floral-aldehyde":  {"accords": ["aldehydic"],                                   "w": 5},
        "floral-oriental":  {"accords": ["oud","amber","balsamic","warm spicy","vanilla","animalic"],  "w": 3},
        "floral-fresh":     {"accords": ["fresh","green","citrus","ozonic","terpenic"],  "w": 2},
        "floral-soft":      {"accords": ["rose","white floral","powdery","musky","vanilla"],           "w": 1},
    },
    "Woody": {
        "sandalwood":       {"accords": ["musky","vanilla","warm spicy","soft spicy","powdery"],       "w": 2},
        "mossy-woods":      {"accords": ["earthy","mossy","patchouli","green"],          "w": 3},
        "woody-aromatic":   {"accords": ["aromatic","herbal","fresh spicy","green","fresh"],           "w": 2},
        "dry-woods":        {"accords": ["citrus","fresh","ozonic","smoky"],             "w": 1},
    },
    "Fougere": {
        "classic-fougere":  {"accords": ["musky","balsamic","earthy","tobacco"],         "w": 2},
        "fresh-fougere":    {"accords": ["citrus","fresh","green","ozonic","fresh spicy"], "w": 2},
        "soft-fougere":     {"accords": ["floral","rose","vanilla","powdery","sweet"],   "w": 1},
    },
    "Leather": {
        "tobacco-leather":  {"accords": ["tobacco","smoky","cacao","coffee","rum","wine","whiskey"],   "w": 3},
        "leather-suede":    {"accords": ["powdery","floral","rose","white floral","fruity"],           "w": 3},
        "leather-smoky":    {"accords": ["smoky","animalic","oud","earthy","balsamic"],  "w": 1},
    },
    "Gourmand": {
        "gourmand-spicy":   {"accords": ["tobacco","cacao","coffee","warm spicy","smoky","cinnamon","rum","wine","whiskey"], "w": 3},
        "gourmand-caramel": {"accords": ["caramel","fruity","honey","almond","coconut","nutty","cherry","tropical","lactonic"], "w": 2},
        "gourmand-vanilla": {"accords": ["vanilla","milky","powdery","sweet","beeswax"], "w": 1},
    },
    "Citrus": {
        "citrus-aromatic":  {"accords": ["aromatic","herbal","fresh spicy","green","earthy"],  "w": 3},
        "citrus-floral":    {"accords": ["floral","rose","white floral","yellow floral","aldehydic"],  "w": 3},
        "hesperidic":       {"accords": ["citrus","fresh","ozonic","terpenic"],          "w": 1},
    },
    "Fresh": {
        "fresh-aromatic":   {"accords": ["aromatic","herbal","fresh spicy"],             "w": 3},
        "fresh-spice":      {"accords": ["warm spicy","soft spicy","cinnamon","smoky"],  "w": 3},
        "fresh-green":      {"accords": ["green","ozonic","terpenic","aquatic","marine"],"w": 1},
    },
    "Aquatic": {
        "aquatic-marine":   {"accords": ["marine","salty","watery"],                     "w": 3},
        "aquatic-oceanic":  {"accords": ["woody","amber","balsamic","earthy","patchouli"],            "w": 2},
        "aqua-fresh":       {"accords": ["citrus","fresh","ozonic","green","herbal"],    "w": 1},
    },
    "Oriental": {
        "oriental-spicy":   {"accords": ["oud","warm spicy","smoky","tobacco","animalic","cinnamon","earthy"], "w": 3},
        "oriental-floral":  {"accords": ["floral","rose","white floral","yellow floral","tuberose"],   "w": 3},
        "oriental-vanilla": {"accords": ["vanilla","sweet","caramel","honey","milky","gourmand"],     "w": 2},
        "soft-oriental":    {"accords": ["amber","balsamic","powdery","musky","soft spicy"],          "w": 1},
    },
}

SUBFAMILY_DEFAULTS: dict[str, str] = {
    "Floral": "floral-soft", "Woody": "dry-woods", "Fougere": "classic-fougere",
    "Leather": "leather-smoky", "Gourmand": "gourmand-vanilla", "Citrus": "hesperidic",
    "Fresh": "fresh-green", "Aquatic": "aqua-fresh", "Oriental": "soft-oriental",
}

# ── moodScores accord 映射 ────────────────────────────────────────────────────
MOOD_ACCORD_WEIGHTS: dict[str, dict[str, float]] = {
    "Warm":   {"amber":1,"balsamic":1,"warm spicy":1,"oud":0.8,"vanilla":0.8,
               "soft spicy":0.7,"cinnamon":0.8,"woody":0.4,"patchouli":0.5},
    "Dark":   {"leather":1,"smoky":1,"tobacco":1,"animalic":0.9,"oud":0.8,
               "earthy":0.6,"cacao":0.5,"coffee":0.5},
    "Spicy":  {"warm spicy":1,"fresh spicy":0.8,"soft spicy":0.8,"cinnamon":0.9,
               "herbal":0.5,"aromatic":0.4},
    "Sweet":  {"sweet":1,"vanilla":1,"caramel":0.9,"honey":0.8,"fruity":0.7,
               "cacao":0.6,"gourmand":1,"almond":0.7,"coconut":0.6},
    "Fresh":  {"fresh":1,"citrus":0.9,"green":0.9,"ozonic":0.9,"aquatic":0.8,
               "marine":0.8,"terpenic":0.8,"fresh spicy":0.6},
    "Floral": {"floral":1,"white floral":1,"rose":1,"yellow floral":0.9,
               "tuberose":0.9,"aldehydic":0.6,"powdery":0.4},
}

MOOD_TAGS_CN: dict[str, str] = {
    "Warm": "温暖", "Dark": "黑暗", "Spicy": "辛香",
    "Sweet": "甜蜜", "Fresh": "清新", "Floral": "花香",
}

# ── gender 推断 ───────────────────────────────────────────────────────────────
MASC_ACCORDS  = {"aromatic","tobacco","leather","herbal","woody","earthy","fresh spicy","smoky","cinnamon","conifer","terpenic"}
FEM_ACCORDS   = {"white floral","floral","rose","yellow floral","tuberose","fruity","powdery","aldehydic","sweet","vanilla","coconut","milky","lactonic"}

# ── 工具函数 ─────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

def parse_notes(raw) -> tuple[list[str], list[str], list[str]]:
    """返回 (topNotes, heartNotes, baseNotes)"""
    if not raw:
        return [], [], []
    raw = raw.strip()
    if raw.startswith("{"):
        try:
            d = json.loads(raw)
            return (
                [n.strip() for n in d.get("top", [])],
                [n.strip() for n in d.get("middle", [])],
                [n.strip() for n in d.get("base", [])],
            )
        except Exception:
            pass
    if raw.startswith("["):
        try:
            flat = [n.strip() for n in json.loads(raw)]
            return flat, [], []
        except Exception:
            pass
    return [], [], []

def parse_votes(raw) -> list[int]:
    if not raw:
        return []
    try:
        return [int(x) for x in json.loads(raw)]
    except Exception:
        return []

def intensity_curve(longevity_votes: list[int], sillage_votes: list[int]) -> list[float]:
    """
    longevity 5桶: [极弱,弱,中,持久,永恒]
    sillage   4桶: [私密,中,强,惊人]
    返回5点强度曲线 (0-1)
    """
    if sum(longevity_votes) > 0:
        total = sum(longevity_votes)
        lon = sum(i * v for i, v in enumerate(longevity_votes)) / (total * 4)  # 0-1
    else:
        lon = 0.5

    if sum(sillage_votes) > 0:
        total = sum(sillage_votes)
        sil = sum(i * v for i, v in enumerate(sillage_votes)) / (total * 3)   # 0-1
    else:
        sil = 0.5

    peak = 0.3 + sil * 0.7          # 峰值强度
    tail = 0.1 + lon * 0.7          # 尾调残留率

    curve = [
        round(peak * 0.85, 3),       # T0: 前调初现
        round(peak,        3),       # T1: 峰值
        round(peak * (0.4 + lon * 0.4), 3),  # T2: 中调接管
        round(peak * tail * 0.8, 3), # T3: 基调浮现
        round(peak * tail * 0.5, 3), # T4: 尾调残留
    ]
    return curve

def score_family(accords: list[str]) -> str:
    scores: dict[str, float] = defaultdict(float)
    for i, acc in enumerate(accords):
        acc_lower = acc.lower()
        multiplier = FIRST_MULTIPLIER if i == 0 else 1.0
        if acc_lower in FAMILY_WEIGHTS:
            for family, w in FAMILY_WEIGHTS[acc_lower].items():
                scores[family] += w * multiplier
    if not scores:
        return FAMILY_DEFAULT
    return max(scores, key=lambda k: scores[k])

def score_subfamily(accords: list[str], family: str) -> str:
    rules = SUBFAMILY_WEIGHTS.get(family, {})
    if not rules:
        return SUBFAMILY_DEFAULTS.get(family, "")
    scores: dict[str, float] = defaultdict(float)
    accord_set = {a.lower() for a in accords}
    for sub_id, rule in rules.items():
        for acc in rule["accords"]:
            if acc in accord_set:
                scores[sub_id] += rule["w"]
    if not scores or max(scores.values()) == 0:
        return SUBFAMILY_DEFAULTS.get(family, list(rules.keys())[0])
    return max(scores, key=lambda k: scores[k])

def derive_mood(accords: list[str]) -> tuple[dict[str, float], list[str]]:
    accord_set = {a.lower() for a in accords}
    raw_scores: dict[str, float] = {}
    for mood, mapping in MOOD_ACCORD_WEIGHTS.items():
        s = sum(w for acc, w in mapping.items() if acc in accord_set)
        raw_scores[mood] = round(min(s / 3.0, 1.0), 3)   # 归一化上限1

    tags = [MOOD_TAGS_CN[m] for m, v in raw_scores.items() if v >= 0.3]
    # 至少保留最高的两个
    if len(tags) < 2:
        top2 = sorted(raw_scores, key=lambda k: -raw_scores[k])[:2]
        tags = [MOOD_TAGS_CN[m] for m in top2]

    return raw_scores, tags

def infer_gender(accords: list[str]) -> str:
    acc_set = {a.lower() for a in accords}
    m = len(acc_set & MASC_ACCORDS)
    f = len(acc_set & FEM_ACCORDS)
    if m == f:
        return "unisex"
    return "masculine" if m > f else "feminine"

# ── 主流程 ───────────────────────────────────────────────────────────────────

def main():
    print("读取 familyMap…")
    with open(FAMILY_MAP_PATH, encoding="utf-8") as fp:
        family_map = json.load(fp)["familyMap"]

    print("读取 Excel…")
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    print(f"共 {len(rows)} 行")

    perfumes = []
    seen_ids: set[str] = set()
    family_dist: dict[str, int] = defaultdict(int)
    subfamily_dist: dict[str, int] = defaultdict(int)

    for idx, row in enumerate(rows):
        brand, name, image, year, accords_raw, notes_raw, lon_raw, sil_raw = row

        if not brand or not name:
            continue

        # ── 解析 accords ──────────────────────────────────────────────────
        accords: list[str] = []
        if accords_raw:
            try:
                accords = [a.strip() for a in json.loads(accords_raw) if a.strip()]
            except Exception:
                pass

        # ── 香调分类 ──────────────────────────────────────────────────────
        family    = score_family(accords)
        subfamily = score_subfamily(accords, family)

        # ── notes ─────────────────────────────────────────────────────────
        top_notes, heart_notes, base_notes = parse_notes(notes_raw)

        # ── 强度曲线 ──────────────────────────────────────────────────────
        lon_votes = parse_votes(lon_raw)
        sil_votes = parse_votes(sil_raw)
        curve = intensity_curve(lon_votes, sil_votes)

        # ── mood ──────────────────────────────────────────────────────────
        mood_scores, mood_tags = derive_mood(accords)

        # ── gender ────────────────────────────────────────────────────────
        gender = infer_gender(accords)

        # ── visualParams（取大类设定）─────────────────────────────────────
        fm = family_map.get(family, {})
        visual_params = {
            "primaryColor": fm.get("primaryColor", "#333"),
            "accentColor":  fm.get("accentColor",  "#666"),
            "warmth":       fm.get("warmth",  0.5),
            "density":      fm.get("density", 0.5),
            "texture":      fm.get("texture", "smooth"),
            "keywords":     fm.get("keywords", []),
        }

        # ── 唯一 ID ───────────────────────────────────────────────────────
        base_id = slugify(f"{brand}-{name}")
        uid = base_id
        n = 1
        while uid in seen_ids:
            uid = f"{base_id}-{n}"
            n += 1
        seen_ids.add(uid)

        # ── 年份 ──────────────────────────────────────────────────────────
        try:
            launch_year = int(year) if year else 0
        except (ValueError, TypeError):
            launch_year = 0

        perfumes.append({
            "id":              uid,
            "name":            str(name).strip(),
            "brand":           str(brand).strip(),
            "year":            launch_year,
            "gender":          gender,
            "fragranceFamily": family,
            "subfamilyId":     subfamily,
            "topNotes":        top_notes,
            "heartNotes":      heart_notes,
            "baseNotes":       base_notes,
            "moodTags":        mood_tags,
            "moodScores":      mood_scores,
            "intensityCurve":  curve,
            "visualParams":    visual_params,
            "imageUrl":        str(image).strip() if image else "",
            "description":     "",
        })

        family_dist[family]    += 1
        subfamily_dist[subfamily] += 1

        if (idx + 1) % 5000 == 0:
            print(f"  已处理 {idx+1}/{len(rows)}…")

    print(f"\n完成，共 {len(perfumes)} 支香水")

    # ── 分布报告 ──────────────────────────────────────────────────────────
    print("\n── fragranceFamily 分布 ─────────────────")
    for k, v in sorted(family_dist.items(), key=lambda x: -x[1]):
        print(f"  {v:>6}  {k}")

    print("\n── subfamilyId 分布（前25）───────────────")
    for k, v in sorted(subfamily_dist.items(), key=lambda x: -x[1])[:25]:
        print(f"  {v:>6}  {k}")

    # ── 写出 ──────────────────────────────────────────────────────────────
    print(f"\n写入 {OUTPUT_PATH}…")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as fp:
        json.dump(perfumes, fp, ensure_ascii=False, indent=2)
    print("Done.")

if __name__ == "__main__":
    main()
