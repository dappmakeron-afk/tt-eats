"""Turns the Overture Maps download (tt_places.geojson) into extra-places.json for the TT Eats site."""
import json, re

MIN_CONFIDENCE = 0.65   # raise to 0.8 for fewer, more reliable places; lower to see more
FOOD = ("restaurant","cafe","coffee","fast_food","pizza","burger","chicken","seafood","diner","bakery","ice_cream",
        "food_stand","food_truck","bar_and_grill","sandwich","soup","noodle","barbecue","buffet","eatery","snack")

def in_tt(la, lo):
    return (10.03 <= la <= 10.85 and -61.92 <= lo <= -60.88 and (la < 10.45 or lo >= -61.8)) or (11.05 <= la <= 11.4 and -60.9 <= lo <= -60.45)

def val(x):
    if isinstance(x, str):
        try: return json.loads(x)
        except Exception: return x
    return x

def label(cat):
    c = re.sub(r"_(restaurant|shop|place)$", "", cat or "restaurant").replace("_", " ").strip()
    return (c or "restaurant").capitalize()

import os, sys

def find_file():
    name = sys.argv[1] if len(sys.argv) > 1 else "tt_places.geojson"
    here = os.path.dirname(os.path.abspath(__file__)); home = os.path.expanduser("~")
    for d in (os.getcwd(), here, os.path.dirname(here), os.path.dirname(os.path.dirname(here)), home,
              os.path.join(home, "Downloads"), os.path.join(home, "Documents")):
        path = os.path.join(d, name)
        if os.path.isfile(path): return path
    sys.exit("Could not find tt_places.geojson. Copy it into the same folder as this script, or run:\n"
             "python make_extra_places.py C:\\full\\path\\to\\tt_places.geojson")

path = find_file(); print("Reading", path)
txt = open(path, encoding="utf-8").read()
try: feats = json.loads(txt)["features"]
except Exception: feats = [json.loads(l.lstrip("\x1e")) for l in txt.splitlines() if l.strip().lstrip("\x1e").startswith("{")]
out, skipped = [], {"not food": 0, "closed": 0, "low confidence": 0, "outside TT": 0, "no name": 0}
for f in feats:
    p = f.get("properties", {}); g = f.get("geometry") or {}
    if g.get("type") != "Point": continue
    lo, la = g["coordinates"][:2]
    names = val(p.get("names")) or {}
    name = (names.get("primary") if isinstance(names, dict) else None) or p.get("name")
    if not name: skipped["no name"] += 1; continue
    cats = val(p.get("categories")) or {}
    prim = cats.get("primary") if isinstance(cats, dict) else None
    alt = (cats.get("alternate") if isinstance(cats, dict) else None) or []
    if not any(k in " ".join([prim or ""] + list(alt)) for k in FOOD): skipped["not food"] += 1; continue
    st = p.get("operating_status")
    if st and st != "open": skipped["closed"] += 1; continue
    conf = p.get("confidence")
    if conf is not None and conf < MIN_CONFIDENCE: skipped["low confidence"] += 1; continue
    if not in_tt(la, lo): skipped["outside TT"] += 1; continue
    addr = val(p.get("addresses")) or []
    a = ", ".join(x for x in [addr[0].get("freeform"), addr[0].get("locality")] if x) if addr and isinstance(addr[0], dict) else ""
    phones = val(p.get("phones")) or []; webs = val(p.get("websites")) or []; soc = val(p.get("socials")) or []
    fb = next((u for u in soc if "facebook.com" in u), ""); ig = next((u for u in soc if "instagram.com" in u), "")
    web = next((u for u in webs if u.startswith("http")), "")
    if "facebook.com" in web and not fb: fb, web = web, ""
    if "instagram.com" in web and not ig: ig, web = web, ""
    rec = {"id": "o" + str(p.get("id") or f.get("id")), "n": name, "c": label(prim), "la": round(la, 6), "lo": round(lo, 6), "a": a,
           "p": phones[0] if phones else "", "w": web, "f": fb, "i": ig, "s": "o"}
    out.append({k: v for k, v in rec.items() if v != ""})
json.dump(out, open("extra-places.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("Saved", os.path.abspath("extra-places.json")); print("Kept", len(out), "restaurants. Skipped:", skipped)
