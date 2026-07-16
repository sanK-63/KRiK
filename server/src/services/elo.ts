import { db } from "../database";
import {
    userElo,
    eloHistory,
    matches,
    rounds,
    brackets,
    teams,
    teamMembers,
    standings,
    tournaments,
    users,
} from "../database/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

const K_FACTOR = 32;
const STARTING_ELO = 1000;

const TOURNAMENT_BONUS: Record<number, number> = {
    1: 50,
    2: 30,
    3: 15,
};

function expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateEloChange(
    winnerElo: number,
    loserElo: number,
    k: number = K_FACTOR
): { winnerDelta: number; loserDelta: number } {
    const expectedWinner = expectedScore(winnerElo, loserElo);
    const expectedLoser = expectedScore(loserElo, winnerElo);

    const winnerDelta = Math.round(k * (1 - expectedWinner));
    const loserDelta = Math.round(k * (0 - expectedLoser));

    return { winnerDelta, loserDelta };
}

function getOrCreateElo(userId: number): { elo: number; wins: number; losses: number; gamesPlayed: number } {
    const existing = db.select().from(userElo).where(eq(userElo.userId, userId)).get();
    if (existing) {
        return { elo: existing.elo, wins: existing.wins, losses: existing.losses, gamesPlayed: existing.gamesPlayed };
    }
    db.insert(userElo).values({ userId, elo: STARTING_ELO, wins: 0, losses: 0, gamesPlayed: 0 }).run();
    return { elo: STARTING_ELO, wins: 0, losses: 0, gamesPlayed: 0 };
}

function updateElo(userId: number, newElo: number, isWin: boolean) {
    const current = getOrCreateElo(userId);
    db.update(userElo)
        .set({
            elo: newElo,
            gamesPlayed: current.gamesPlayed + 1,
            wins: current.wins + (isWin ? 1 : 0),
            losses: current.losses + (isWin ? 0 : 1),
            updatedAt: new Date().toISOString(),
        })
        .where(eq(userElo.userId, userId))
        .run();
}

function recordHistory(
    userId: number,
    oldElo: number,
    newElo: number,
    change: number,
    reason: string,
    tournamentId?: number,
    matchId?: number
) {
    db.insert(eloHistory)
        .values({
            userId,
            oldElo,
            newElo,
            change,
            reason,
            tournamentId: tournamentId ?? null,
            matchId: matchId ?? null,
        })
        .run();
}

function getTeamAverageElo(teamId: number): number {
    const members = db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId))
        .all();

    if (members.length === 0) return STARTING_ELO;

    let totalElo = 0;
    for (const m of members) {
        const e = getOrCreateElo(m.userId);
        totalElo += e.elo;
    }
    return Math.round(totalElo / members.length);
}

function getTeamMemberIds(teamId: number): number[] {
    const members = db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId))
        .all();
    return members.map((m) => m.userId);
}

export function processMatchResult(matchId: number) {
    const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
    if (!match || !match.winner || !match.team1 || !match.team2) return;
    if (match.status !== "completed") return;

    const winnerId = match.winner;
    const loserId = match.team1 === winnerId ? match.team2 : match.team1;

    const winnerAvg = getTeamAverageElo(winnerId);
    const loserAvg = getTeamAverageElo(loserId);

    const { winnerDelta, loserDelta } = calculateEloChange(winnerAvg, loserAvg);

    const winnerMembers = getTeamMemberIds(winnerId);
    const loserMembers = getTeamMemberIds(loserId);

    // Get tournamentId from match -> round -> bracket
    const round = db.select().from(rounds).where(eq(rounds.id, match.roundId)).get();
    let tournamentId: number | undefined;
    if (round) {
        const bracket = db.select().from(brackets).where(eq(brackets.id, round.bracketId)).get();
        if (bracket) tournamentId = bracket.tournamentId;
    }

    for (const uid of winnerMembers) {
        const old = getOrCreateElo(uid);
        const newElo = old.elo + winnerDelta;
        updateElo(uid, newElo, true);
        recordHistory(uid, old.elo, newElo, winnerDelta, "match", tournamentId, matchId);
    }

    for (const uid of loserMembers) {
        const old = getOrCreateElo(uid);
        const newElo = old.elo + loserDelta;
        updateElo(uid, newElo, false);
        recordHistory(uid, old.elo, newElo, loserDelta, "match", tournamentId, matchId);
    }

    return {
        matchId,
        tournamentId,
        winnerDelta,
        loserDelta,
        winnerTeamId: winnerId,
        loserTeamId: loserId,
    };
}

export function processTournamentEnd(tournamentId: number) {
    const tournament = db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).get();
    if (!tournament || tournament.status !== "completed") return;

    const tournamentStandings = db
        .select()
        .from(standings)
        .where(eq(standings.tournamentId, tournamentId))
        .all()
        .sort((a, b) => b.points - a.points);

    const results: Array<{ teamId: number; position: number; bonus: number }> = [];

    for (let i = 0; i < tournamentStandings.length; i++) {
        const position = i + 1;
        const bonus = TOURNAMENT_BONUS[position];
        if (!bonus) continue;

        const s = tournamentStandings[i];
        const memberIds = getTeamMemberIds(s.teamId);

        for (const uid of memberIds) {
            const old = getOrCreateElo(uid);
            const newElo = old.elo + bonus;
            updateElo(uid, newElo, true);
            recordHistory(uid, old.elo, newElo, bonus, "tournament_bonus", tournamentId);
        }

        results.push({ teamId: s.teamId, position, bonus });
    }

    return { tournamentId, results };
}

export function getLeaderboard(options: { page?: number; limit?: number } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const total = db.select({ count: sql<number>`count(*)` }).from(users).get()?.count || 0;

    const rows = db
        .select({
            userId: users.id,
            elo: sql<number>`COALESCE(${userElo.elo}, 1000)`,
            gamesPlayed: sql<number>`COALESCE(${userElo.gamesPlayed}, 0)`,
            wins: sql<number>`COALESCE(${userElo.wins}, 0)`,
            losses: sql<number>`COALESCE(${userElo.losses}, 0)`,
            username: users.username,
            displayName: users.displayName,
            avatar: users.avatar,
        })
        .from(users)
        .leftJoin(userElo, eq(users.id, userElo.userId))
        .orderBy(desc(sql`COALESCE(${userElo.elo}, 1000)`))
        .limit(limit)
        .offset(offset)
        .all();

    const leaderboard = rows.map((r, i) => ({
        rank: offset + i + 1,
        ...r,
        winrate: r.gamesPlayed > 0 ? Math.round((r.wins / r.gamesPlayed) * 100) : 0,
    }));

    return { leaderboard, total, page, limit };
}

export function getUserElo(userId: number) {
    const elo = db.select().from(userElo).where(eq(userElo.userId, userId)).get();
    if (!elo) {
        return {
            userId,
            elo: STARTING_ELO,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            winrate: 0,
            rank: null,
            updatedAt: null,
        };
    }

    const rankRow = db
        .select({ rank: sql<number>`count(*) + 1` })
        .from(userElo)
        .where(gte(userElo.elo, elo.elo))
        .get();

    return {
        userId,
        elo: elo.elo,
        gamesPlayed: elo.gamesPlayed,
        wins: elo.wins,
        losses: elo.losses,
        winrate: elo.gamesPlayed > 0 ? Math.round((elo.wins / elo.gamesPlayed) * 100) : 0,
        rank: rankRow?.rank || 1,
        updatedAt: elo.updatedAt,
    };
}

export function getEloHistory(userId: number, limit: number = 50) {
    return db
        .select()
        .from(eloHistory)
        .where(eq(eloHistory.userId, userId))
        .orderBy(desc(eloHistory.createdAt))
        .limit(limit)
        .all();
}

export function recalculateAll() {
    const allElo = db.select().from(userElo).all();
    for (const e of allElo) {
        db.update(userElo)
            .set({ elo: STARTING_ELO, wins: 0, losses: 0, gamesPlayed: 0 })
            .where(eq(userElo.userId, e.userId))
            .run();
    }
    db.delete(eloHistory).run();

    const allMatches = db
        .select()
        .from(matches)
        .where(eq(matches.status, "completed"))
        .all()
        .sort((a, b) => a.id - b.id);

    for (const m of allMatches) {
        if (m.winner && m.team1 && m.team2) {
            processMatchResult(m.id);
        }
    }

    const allTournaments = db
        .select()
        .from(tournaments)
        .where(eq(tournaments.status, "completed"))
        .all();

    for (const t of allTournaments) {
        processTournamentEnd(t.id);
    }

    return { matchesProcessed: allMatches.length, tournamentsProcessed: allTournaments.length };
}
