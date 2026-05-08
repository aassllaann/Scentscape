import csv, json

# 读 CSV
csv_map = {}
with open('D:/香水网站/scentscape/data/final_perfume_data.csv', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = (row['Name'].strip().lower(), row['Brand'].strip().lower())
        csv_map[key] = {
            'description': row['Description'].strip(),
            'notes': [n.strip() for n in row['Notes'].split(',') if n.strip()],
        }

# 读 JSON
with open('D:/香水网站/scentscape/data/perfumes.json', encoding='utf-8') as f:
    perfumes = json.load(f)

matched = 0
for p in perfumes:
    key = (p['name'].strip().lower(), p['brand'].strip().lower())
    if key in csv_map:
        p['description'] = csv_map[key]['description']
        p['notes'] = csv_map[key]['notes']
        matched += 1
    else:
        p.setdefault('description', '')
        p.setdefault('notes', [])

print(f'Total: {len(perfumes)}, matched: {matched}')

with open('D:/香水网站/scentscape/data/perfumes.json', 'w', encoding='utf-8') as f:
    json.dump(perfumes, f, ensure_ascii=False, indent=2)
print('Done')
