import { sqlite } from "./database";

const TMDB_TOKEN = process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";

async function updatePosters() {
    if (!TMDB_TOKEN) {
        console.log("TMDB_API_KEY not set, skipping poster update");
        return;
    }

    const movies = sqlite.prepare("SELECT id, title, year FROM movies WHERE poster IS NULL OR poster = ''").all() as { id: number; title: string; year: number | null }[];
    console.log(`Found ${movies.length} movies without posters`);

    let updated = 0;
    for (const m of movies) {
        try {
            const searchTitle = m.title.replace(/\s*\(.*\)\s*$/, "").trim();
            const params = `query=${encodeURIComponent(searchTitle)}&language=ru-RU&include_adult=false`;
            if (m.year) {
                // no year filter in search, we'll match below
            }
            const r = await fetch(`${TMDB_BASE}/search/movie?${params}`, {
                headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
            });
            if (!r.ok) continue;
            const data = await r.json();
            const results = data.results || [];

            let best = results[0];
            if (m.year && results.length > 1) {
                best = results.find((x: any) => x.release_date?.startsWith(String(m.year))) || best;
            }

            if (best?.poster_path) {
                const poster = `https://image.tmdb.org/t/p/w500${best.poster_path}`;
                sqlite.prepare("UPDATE movies SET poster = ? WHERE id = ?").run(poster, m.id);
                updated++;
                console.log(`  [OK] ${m.title} -> ${best.title} (${best.release_date?.slice(0, 4)})`);
            } else {
                console.log(`  [--] ${m.title} -> no poster found`);
            }

            await new Promise((res) => setTimeout(res, 250));
        } catch (err) {
            console.error(`  [ERR] ${m.title}: ${err}`);
        }
    }

    console.log(`Done. Updated ${updated}/${movies.length} posters`);
}

updatePosters().catch(console.error);
