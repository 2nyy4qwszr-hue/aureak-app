import csv
import sys

BASE = "output/results_20260321_114837.csv"
RERUN = "output/results_20260321_141029.csv"
OUT = "output/results_merged.csv"

def read_csv(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f, delimiter=";"))

base = read_csv(BASE)
rerun = read_csv(RERUN)

# Index rerun by numaffil
rerun_index = {row["numaffil"]: row for row in rerun}

merged = []
replaced = 0
for row in base:
    key = row["numaffil"]
    if key in rerun_index:
        merged.append(rerun_index[key])
        replaced += 1
    else:
        merged.append(row)

fieldnames = list(base[0].keys())
with open(OUT, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
    w.writeheader()
    w.writerows(merged)

print(f"Base: {len(base)} joueurs")
print(f"Rerun: {len(rerun)} joueurs")
print(f"Remplacés: {replaced}")
print(f"Output: {OUT} ({len(merged)} lignes)")
