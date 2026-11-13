# TT Eats – Trinidad & Tobago restaurant directory

Free restaurant directory with a "Near me" button, filters for location, food type and "Open now", visitor ratings and comments, phone and social links, and Google Maps directions. It works offline after the first visit.

## Everything here is free
- Hosting: GitHub Pages.
- Restaurant data: OpenStreetMap (no key, no card). Downloaded once, saved on each visitor's device, and refreshed weekly.
- Directions and "View on Google Maps": plain links, no Google account or billing needed.
- Comments and ratings (optional): Firebase's free Spark plan. It needs no card and does not bill; if the free daily limit is reached it just pauses until the next day.

## Step 1 – Upload to GitHub (files must be at the top level)
Unzip this folder, open the **inner** `tt-eats` folder, select everything inside it and drag that into your repository. The repository's main page must list `index.html` directly, not a folder called `tt-eats`.

## Step 2 – Turn the website on
Repository **Settings → Pages → Deploy from a branch → main / (root) → Save**. Open `https://YOUR-USERNAME.github.io/REPO-NAME/` after a minute.

## Step 3 – Shared comments and ratings (optional)
Without this, comments and ratings are saved only on the visitor's own device.
1. At console.firebase.google.com create a project, keep the free Spark plan, then **Build → Firestore Database → Create database**.
2. In the **Rules** tab paste this and **Publish**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /restaurants/{r} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['sum','n'])
                    && request.resource.data.n == 1
                    && request.resource.data.sum >= 1 && request.resource.data.sum <= 5;
      allow update: if request.resource.data.keys().hasOnly(['sum','n'])
                    && request.resource.data.n == resource.data.n + 1
                    && request.resource.data.sum - resource.data.sum >= 1
                    && request.resource.data.sum - resource.data.sum <= 5;
      match /comments/{c} {
        allow read: if true;
        allow create: if request.resource.data.n is string && request.resource.data.n.size() <= 40
                      && request.resource.data.c is string && request.resource.data.c.size() <= 500
                      && request.resource.data.s is number && request.resource.data.s >= 1 && request.resource.data.s <= 5;
      }
    }
  }
}
```
3. **Project settings → Your apps → Web**, register an app, copy the config values into `config.js`, and commit.
4. Remove unwanted comments from the Firestore Data tab.

## Fixing missing or wrong restaurant details
The data comes from OpenStreetMap, so some places lack hours, phone numbers or social links. Anyone can fix this at openstreetmap.org (free account). Add `opening_hours`, `phone`, `website`, `contact:facebook` or `contact:instagram` to the place, and it shows up here within about a week.

## Notes
- Ratings are from TT Eats visitors, not Google, since Google's rating data isn't available for free.
- After changing site files, change `tt-eats-v8` in `sw.js` to `v9` so phones fetch the update.

## Keeping the list accurate (overrides.json)
`overrides.json` lets you correct the list yourself, and changes show immediately. Edit it on GitHub like any file:
```
{
  "hide": ["n123456789"],
  "fix": { "w987654321": { "p": "868-555-0100", "h": "Mo-Su 08:00-22:00" } },
  "add": [ { "id": "x1", "n": "Restaurant name", "c": "Roti", "la": 10.4167, "lo": -61.4500, "a": "Street, Couva", "p": "868-555-0100", "h": "Mo-Sa 09:00-21:00", "f": "https://facebook.com/pagename" } ]
}
```
- `hide`: IDs of places that don't exist or are closed. Tap the restaurant and copy the ID shown under its details (for example `w384248420`). Put it in quotes: `"hide": ["w384248420"]`. A plain number also works, but the full ID is safer.
- `fix`: change a field for one place: `n` name, `c` food type, `a` address, `p` phone, `h` hours, `w` website, `f` Facebook, `i` Instagram, `wa` WhatsApp link.
- `add`: a restaurant missing from the map. `id` must be unique and start with `x` (for example `x1`, `x2`); `la`/`lo` are the coordinates from Google Maps (right-click the spot).
- Better long term: fix the problem on OpenStreetMap itself (the "Fix it" link), so it is corrected for everyone.

The site also automatically ignores anything outside Trinidad and Tobago and merges duplicate listings of the same place.

## Adding more restaurants from Overture Maps (free)
Overture Maps is a free open dataset that often lists places OpenStreetMap is missing. It also contains closed or wrong businesses, so these places are marked "not yet verified" on the site. Do this once, and repeat every few months.
1. Install Python from python.org (on the installer's first screen, tick **Add python.exe to PATH**).
2. Open **Command Prompt** and run: `pip install overturemaps`
3. Make a folder, e.g. `C:\tt`, and copy `tools/make_extra_places.py` into it. In Command Prompt run: `cd C:\tt` then
   `overturemaps download --bbox=-61.95,10.0,-60.4,11.4 -f geojson --type=place -o tt_places.geojson`
4. Run: `python make_extra_places.py`. It prints how many restaurants it kept and creates `extra-places.json`.
5. Upload `extra-places.json` to the top level of your repository, replacing the empty one.
Places already found on OpenStreetMap are not repeated. To remove a wrong one, copy its ID from the details and add it to `hide`.
