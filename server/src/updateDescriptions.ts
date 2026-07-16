import { sqlite } from "./database";

const TMDB_TOKEN = process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";

async function updateDescriptions() {
    if (!TMDB_TOKEN) {
        console.log("TMDB_API_KEY not set");
        return;
    }

    const movies = sqlite.prepare("SELECT id, title, year FROM movies WHERE description IS NULL OR description = ''").all() as { id: number; title: string; year: number | null }[];
    console.log(`Found ${movies.length} movies without descriptions`);

    let updated = 0;
    for (const m of movies) {
        try {
            const searchTitle = m.title.replace(/\s*\(.*\)\s*$/, "").trim();
            const r = await fetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(searchTitle)}&language=ru-RU&include_adult=false`, {
                headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
            });
            if (!r.ok) continue;
            const data = await r.json() as any;
            const results = data.results || [];

            let best = results[0];
            if (m.year && results.length > 1) {
                best = results.find((x: any) => x.release_date?.startsWith(String(m.year))) || best;
            }

            if (best?.overview) {
                sqlite.prepare("UPDATE movies SET description = ? WHERE id = ?").run(best.overview, m.id);
                updated++;
                console.log(`  [OK] ${m.title}`);
            } else {
                console.log(`  [--] ${m.title} -> no description`);
            }

            await new Promise((res) => setTimeout(res, 250));
        } catch (err) {
            console.error(`  [ERR] ${m.title}: ${err}`);
        }
    }

    console.log(`Done. Updated ${updated}/${movies.length} descriptions`);
}

updateDescriptions().catch(console.error);
