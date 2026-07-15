import { Router, Response } from "express";
import { db } from "../database";
import {
    tournaments,
    matches,
    rounds,
    brackets,
    standings,
    registrations,
    registrationAnswers,
    teams,
    teamMembers,
    games,
    tournamentRules,
    tournamentStages,
    playerStatistics,
    users,
} from "../database/schema";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { processMatchResult, processTournamentEnd } from "../services/elo";

const router = Router();

const VALID_STATUSES = ["draft", "registration", "active", "completed"];
const STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ["registration"],
    registration: ["active", "draft"],
    active: ["completed", "registration"],
    completed: [],
};

function getTournamentFull(id: number) {
    const t = db.select().from(tournaments).where(eq(tournaments.id, id)).get();
    if (!t) return null;

    const game = db.select().from(games).where(eq(games.id, t.gameId)).get();
    const rules = db.select().from(tournamentRules).where(eq(tournamentRules.tournamentId, id)).all();
    const stages = db.select().from(tournamentStages).where(eq(tournamentStages.tournamentId, id)).all();
    const regs = db.select().from(registrations).where(eq(registrations.tournamentId, id)).all();
    const bracketList = db.select().from(brackets).where(eq(brackets.tournamentId, id)).all();

    let allMatches: any[] = [];
    let allStandings: any[] = [];
    let allStats: any[] = [];

    if (bracketList.length > 0) {
        const bracketIds = bracketList.map((b) => b.id);
        const roundList = db.select().from(rounds).where(sql`${rounds.bracketId} IN ${bracketIds}`).all();
        if (roundList.length > 0) {
            const roundIds = roundList.map((r) => r.id);
            const rawMatches = db.select().from(matches).where(sql`${matches.roundId} IN ${roundIds}`).all();
            allMatches = rawMatches.map((m) => {
                const t1 = m.team1 ? db.select().from(teams).where(eq(teams.id, m.team1)).get() : null;
                const t2 = m.team2 ? db.select().from(teams).where(eq(teams.id, m.team2)).get() : null;
                return { ...m, team1Name: t1?.name || null, team2Name: t2?.name || null };
            });
        }
    }

    allStandings = db.select().from(standings).where(eq(standings.tournamentId, id)).all();
    allStats = db.select().from(playerStatistics).where(eq(playerStatistics.tournamentId, id)).all();

    const creator = t.createdBy ? db.select().from(users).where(eq(users.id, t.createdBy)).get() : null;

    const enrichedRegs = regs.map((r) => {
        let team: any = null;
        let user: any = null;
        if (r.teamId) {
            const t = db.select().from(teams).where(eq(teams.id, r.teamId)).get();
            const members = db.select().from(teamMembers).where(eq(teamMembers.teamId, r.teamId)).all();
            team = t ? { ...t, members } : null;
        }
        if (r.userId) {
            const { users } = require("../database/schema");
            user = db.select().from(users).where(eq(users.id, r.userId)).get() || null;
            if (user) {
                user = { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar };
            }
        }
        return { ...r, team, user };
    });

    return {
        ...t,
        gameName: game?.name || null,
        rules: rules.length > 0 ? rules[rules.length - 1].markdown : null,
        stages,
        registrations: enrichedRegs,
        matches: allMatches,
        standings: allStandings,
        stats: allStats,
        teamsCount: new Set(regs.filter((r) => r.teamId).map((r) => r.teamId)).size,
        creatorName: creator?.displayName || creator?.username || null,
        creatorAvatar: creator?.avatar || null,
        registrationForm: t.registrationForm ? (() => { try { return JSON.parse(t.registrationForm); } catch { return []; } })() : [],
    };
}

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const all = db.select().from(tournaments).all();
    const result = all
        .filter((t) => t.status !== "draft" || t.createdBy === userId)
        .map((t) => {
            const game = db.select().from(games).where(eq(games.id, t.gameId)).get();
            const regCount = db.select({ count: sql<number>`count(*)` }).from(registrations).where(eq(registrations.tournamentId, t.id)).get();
            const matchCount = db.select({ count: sql<number>`count(*)` }).from(matches)
                .innerJoin(rounds, eq(matches.roundId, rounds.id))
                .innerJoin(brackets, eq(rounds.bracketId, brackets.id))
                .where(eq(brackets.tournamentId, t.id))
                .get();
            const creator = t.createdBy ? db.select().from(users).where(eq(users.id, t.createdBy)).get() : null;
            return {
                ...t,
                gameName: game?.name || null,
                registrationCount: regCount?.count || 0,
                matchCount: matchCount?.count || 0,
                creatorName: creator?.displayName || creator?.username || null,
                creatorAvatar: creator?.avatar || null,
            };
        });
    res.json(result);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = getTournamentFull(id);
    if (!result) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    res.json(result);
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    const {
        templateId, gameId, title, description, banner, format, participantType,
        registrationOpen, registrationClose, startDate, endDate, rules, registrationForm,
    } = req.body;

    if (!gameId || !title) {
        res.status(400).json({ error: "gameId and title are required" });
        return;
    }

    const game = db.select().from(games).where(eq(games.id, gameId)).get();
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }

    const tournament = db.insert(tournaments).values({
        templateId: templateId || null,
        gameId,
        createdBy: req.userId || null,
        title,
        description: description || null,
        banner: banner || null,
        status: "draft",
        format: format || "single_elimination",
        participantType: participantType || "team",
        registrationOpen: registrationOpen || null,
        registrationClose: registrationClose || null,
        startDate: startDate || null,
        endDate: endDate || null,
        registrationForm: registrationForm ? JSON.stringify(registrationForm) : null,
    }).returning().get();

    if (rules) {
        db.insert(tournamentRules).values({ tournamentId: tournament.id, markdown: rules }).run();
    }

    res.status(201).json({ id: tournament.id, title: tournament.title, status: tournament.status });
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const t = db.select().from(tournaments).where(eq(tournaments.id, id)).get();
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }

    if (t.status === "draft" && t.createdBy !== req.userId) {
        res.status(403).json({ error: "Only the creator can edit a draft tournament" });
        return;
    }

    const {
        gameId, title, description, banner, format, participantType,
        registrationOpen, registrationClose, startDate, endDate, rules, registrationForm,
    } = req.body;

    db.update(tournaments)
        .set({
            ...(gameId !== undefined && { gameId }),
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(banner !== undefined && { banner }),
            ...(format !== undefined && { format }),
            ...(participantType !== undefined && { participantType }),
            ...(registrationOpen !== undefined && { registrationOpen }),
            ...(registrationClose !== undefined && { registrationClose }),
            ...(startDate !== undefined && { startDate }),
            ...(endDate !== undefined && { endDate }),
            ...(registrationForm !== undefined && { registrationForm: JSON.stringify(registrationForm) }),
        })
        .where(eq(tournaments.id, id))
        .run();

    if (rules !== undefined) {
        const existing = db.select().from(tournamentRules).where(eq(tournamentRules.tournamentId, id)).all();
        const maxVersion = existing.length > 0 ? Math.max(...existing.map((r) => r.version)) : 0;
        db.insert(tournamentRules).values({ tournamentId: id, markdown: rules, version: maxVersion + 1 }).run();
    }

    res.json({ ok: true });
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const t = db.select().from(tournaments).where(eq(tournaments.id, id)).get();
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    if (t.status === "draft" && t.createdBy !== req.userId) {
        res.status(403).json({ error: "Only the creator can delete a draft tournament" });
        return;
    }
    db.delete(tournaments).where(eq(tournaments.id, id)).run();
    res.json({ ok: true });
});

router.patch("/:id/status", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
        res.status(400).json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` });
        return;
    }

    const t = db.select().from(tournaments).where(eq(tournaments.id, id)).get();
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }

    if (t.status === "draft" && t.createdBy !== req.userId) {
        res.status(403).json({ error: "Only the creator can change status of a draft tournament" });
        return;
    }

    const allowed = STATUS_TRANSITIONS[t.status] || [];
    if (!allowed.includes(status)) {
        res.status(400).json({ error: `Cannot transition from "${t.status}" to "${status}". Allowed: ${allowed.join(", ") || "none"}` });
        return;
    }

    const updates: Record<string, unknown> = { status };
    if (status === "active") updates.startDate = new Date().toISOString();
    if (status === "completed") updates.endDate = new Date().toISOString();

    db.update(tournaments).set(updates).where(eq(tournaments.id, id)).run();

    let eloResult = null;
    if (status === "completed") {
        eloResult = processTournamentEnd(id);
    }

    res.json({ id, status, elo: eloResult });
});

router.get("/:id/registrations", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const regs = db.select().from(registrations).where(eq(registrations.tournamentId, id)).all();
    const result = regs.map((r) => {
        let team: any = null;
        let user: any = null;
        if (r.teamId) {
            const t = db.select().from(teams).where(eq(teams.id, r.teamId)).get();
            const members = db.select().from(teamMembers).where(eq(teamMembers.teamId, r.teamId)).all();
            team = t ? { ...t, members } : null;
        }
        if (r.userId) {
            const { users } = require("../database/schema");
            user = db.select().from(users).where(eq(users.id, r.userId)).get() || null;
            if (user) user = { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar };
        }
        const answers = db.select().from(registrationAnswers).where(eq(registrationAnswers.registrationId, r.id)).all();
        return { ...r, team, user, answers };
    });
    res.json(result);
});

router.post("/:id/register", authMiddleware, (req: AuthRequest, res: Response) => {
    const tournamentId = Number(req.params.id);
    const { teamId, answers } = req.body;

    const t = db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).get();
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    if (t.status !== "registration") {
        res.status(400).json({ error: "Tournament is not accepting registrations" });
        return;
    }

    if (t.participantType === "team" && teamId) {
        const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
        if (!team) {
            res.status(404).json({ error: "Team not found" });
            return;
        }
    }

    const existingReg = db.select().from(registrations)
        .where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.userId, req.userId!)))
        .get();
    if (existingReg) {
        res.status(409).json({ error: "Already registered" });
        return;
    }

    const reg = db.insert(registrations).values({
        tournamentId,
        userId: req.userId!,
        teamId: teamId || null,
        status: "pending",
    }).returning().get();

    if (Array.isArray(answers)) {
        for (const a of answers) {
            db.insert(registrationAnswers).values({ registrationId: reg.id, field: a.field, value: a.value || null }).run();
        }
    }

    res.status(201).json({ id: reg.id, status: reg.status });
});

router.delete("/:id/register", authMiddleware, (req: AuthRequest, res: Response) => {
    const tournamentId = Number(req.params.id);
    const reg = db.select().from(registrations)
        .where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.userId, req.userId!)))
        .get();
    if (!reg) {
        res.status(404).json({ error: "Registration not found" });
        return;
    }
    db.delete(registrations).where(eq(registrations.id, reg.id)).run();
    res.json({ ok: true });
});

router.patch("/:id/registrations/:regId/approve", authMiddleware, (req: AuthRequest, res: Response) => {
    const regId = Number(req.params.regId);
    const reg = db.select().from(registrations).where(eq(registrations.id, regId)).get();
    if (!reg) {
        res.status(404).json({ error: "Registration not found" });
        return;
    }
    db.update(registrations).set({ status: "approved" }).where(eq(registrations.id, regId)).run();
    res.json({ ok: true, status: "approved" });
});

router.patch("/:id/registrations/:regId/reject", authMiddleware, (req: AuthRequest, res: Response) => {
    const regId = Number(req.params.regId);
    const reg = db.select().from(registrations).where(eq(registrations.id, regId)).get();
    if (!reg) {
        res.status(404).json({ error: "Registration not found" });
        return;
    }
    db.update(registrations).set({ status: "rejected" }).where(eq(registrations.id, regId)).run();
    res.json({ ok: true, status: "rejected" });
});

router.get("/:id/standings", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const s = db.select().from(standings).where(eq(standings.tournamentId, id)).all();
    const result = s.map((row) => {
        const team = db.select().from(teams).where(eq(teams.id, row.teamId)).get();
        return { ...row, teamName: team?.name || null, teamTag: team?.tag || null };
    }).sort((a, b) => b.points - a.points);
    res.json(result);
});

router.get("/:id/stats", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const stats = db.select().from(playerStatistics).where(eq(playerStatistics.tournamentId, id)).all();
    const { users } = require("../database/schema");
    const result = stats.map((s) => {
        const user = db.select().from(users).where(eq(users.id, s.userId)).get();
        return {
            ...s,
            username: user?.username || null,
            displayName: user?.displayName || null,
            avatar: user?.avatar || null,
        };
    });
    res.json(result);
});

router.patch("/:tournamentId/matches/:matchId", authMiddleware, (req: AuthRequest, res: Response) => {
    const matchId = Number(req.params.matchId);
    const tournamentId = Number(req.params.tournamentId);
    const { score1, score2, winnerTeamId, status, judgeId } = req.body;

    const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
    if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
    }

    const wasCompleted = match.status === "completed";

    const updates: Record<string, unknown> = {};
    if (score1 !== undefined) updates.score1 = score1;
    if (score2 !== undefined) updates.score2 = score2;
    if (judgeId !== undefined) updates.judgeId = judgeId;
    if (status !== undefined) updates.status = status;
    if (winnerTeamId !== undefined) {
        updates.winner = winnerTeamId;
        updates.status = "completed";
    }

    db.update(matches).set(updates).where(eq(matches.id, matchId)).run();

    let eloResult = null;
    const justCompleted = !wasCompleted && (winnerTeamId !== undefined || status === "completed");

    if (justCompleted) {
        const updatedMatch = db.select().from(matches).where(eq(matches.id, matchId)).get();
        if (updatedMatch && updatedMatch.winner) {
            eloResult = processMatchResult(matchId);

            const loserTeamId = updatedMatch.winner === updatedMatch.team1 ? updatedMatch.team2 : updatedMatch.team1;
            if (loserTeamId) {
                const existingStanding = db.select().from(standings).where(
                    and(eq(standings.tournamentId, tournamentId), eq(standings.teamId, updatedMatch.winner))
                ).get();
                if (existingStanding) {
                    db.update(standings).set({
                        wins: existingStanding.wins + 1,
                        points: existingStanding.points + 3,
                    }).where(eq(standings.id, existingStanding.id)).run();
                } else {
                    db.insert(standings).values({
                        tournamentId,
                        teamId: updatedMatch.winner,
                        wins: 1,
                        points: 3,
                    }).run();
                }

                const existingLoserStanding = db.select().from(standings).where(
                    and(eq(standings.tournamentId, tournamentId), eq(standings.teamId, loserTeamId))
                ).get();
                if (existingLoserStanding) {
                    db.update(standings).set({
                        losses: existingLoserStanding.losses + 1,
                    }).where(eq(standings.id, existingLoserStanding.id)).run();
                } else {
                    db.insert(standings).values({
                        tournamentId,
                        teamId: loserTeamId,
                        losses: 1,
                        points: 0,
                    }).run();
                }
            }

            const winnerMembers = db.select().from(teamMembers).where(eq(teamMembers.teamId, updatedMatch.winner)).all();
            for (const m of winnerMembers) {
                const existingStat = db.select().from(playerStatistics).where(
                    and(eq(playerStatistics.tournamentId, tournamentId), eq(playerStatistics.userId, m.userId))
                ).get();
                if (existingStat) {
                    db.update(playerStatistics).set({
                        matches: existingStat.matches + 1,
                        wins: existingStat.wins + 1,
                    }).where(eq(playerStatistics.id, existingStat.id)).run();
                } else {
                    db.insert(playerStatistics).values({
                        tournamentId,
                        userId: m.userId,
                        teamId: updatedMatch.winner,
                        matches: 1,
                        wins: 1,
                        losses: 0,
                    }).run();
                }
            }

            if (loserTeamId) {
                const loserMembers = db.select().from(teamMembers).where(eq(teamMembers.teamId, loserTeamId)).all();
                for (const m of loserMembers) {
                    const existingStat = db.select().from(playerStatistics).where(
                        and(eq(playerStatistics.tournamentId, tournamentId), eq(playerStatistics.userId, m.userId))
                    ).get();
                    if (existingStat) {
                        db.update(playerStatistics).set({
                            matches: existingStat.matches + 1,
                            losses: existingStat.losses + 1,
                        }).where(eq(playerStatistics.id, existingStat.id)).run();
                    } else {
                        db.insert(playerStatistics).values({
                            tournamentId,
                            userId: m.userId,
                            teamId: loserTeamId,
                            matches: 1,
                            wins: 0,
                            losses: 1,
                        }).run();
                    }
                }
            }
        }

        const currentRound = db.select().from(rounds).where(eq(rounds.id, match.roundId)).get();
        if (currentRound) {
            const currentBracket = db.select().from(brackets).where(eq(brackets.id, currentRound.bracketId)).get();
            if (currentBracket) {
                const allRounds = db.select().from(rounds).where(eq(rounds.bracketId, currentBracket.id))
                    .all().sort((a, b) => a.number - b.number);
                const currentRoundIndex = allRounds.findIndex((r) => r.id === match.roundId);

                if (currentRoundIndex >= 0 && currentRoundIndex < allRounds.length - 1) {
                    const nextRound = allRounds[currentRoundIndex + 1];
                    const nextMatches = db.select().from(matches).where(eq(matches.roundId, nextRound.id)).all();

                    if (nextMatches.length > 0 && updatedMatch) {
                        const matchPositionInRound = db.select().from(matches)
                            .where(eq(matches.roundId, match.roundId))
                            .all().sort((a, b) => a.id - b.id)
                            .findIndex((m) => m.id === matchId);

                        const nextMatchIndex = Math.floor(matchPositionInRound / 2);
                        const targetNextMatch = nextMatches[nextMatchIndex];

                        if (targetNextMatch && updatedMatch.winner) {
                            const slotToUpdate = targetNextMatch.team1 == null ? "team1" : "team2";
                            db.update(matches).set({ [slotToUpdate]: updatedMatch.winner })
                                .where(eq(matches.id, targetNextMatch.id)).run();
                        }
                    }
                }
            }
        }

        const tournamentBracket = db.select().from(brackets).where(eq(brackets.tournamentId, tournamentId)).get();
        if (tournamentBracket) {
            const tournamentRounds = db.select().from(rounds).where(eq(rounds.bracketId, tournamentBracket.id)).all();
            const tournamentRoundIds = tournamentRounds.map((r) => r.id);
            const allTournamentMatches = tournamentRoundIds.length > 0
                ? db.select().from(matches).where(sql`${matches.roundId} IN (${sql.join(tournamentRoundIds.map((id) => sql`${id}`), sql`, `)})`).all()
                : [];
            const nonByeMatches = allTournamentMatches.filter((m) => m.status !== "bye");
            const allFinished = nonByeMatches.length > 0 && nonByeMatches.every((m) => m.status === "completed");

            if (allFinished) {
                const currentTournament = db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).get();
                if (currentTournament && currentTournament.status !== "completed") {
                    db.update(tournaments).set({ status: "completed" }).where(eq(tournaments.id, tournamentId)).run();
                    processTournamentEnd(tournamentId);
                }
            }
        }
    }

    res.json({ id: matchId, ...updates, elo: eloResult });
});

router.post("/:id/generate-bracket", authMiddleware, (req: AuthRequest, res: Response) => {
    const tournamentId = Number(req.params.id);
    const t = db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).get();
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }

    const approvedRegs = db.select().from(registrations)
        .where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.status, "approved")))
        .all();

    if (approvedRegs.length < 2) {
        res.status(400).json({ error: "Need at least 2 approved registrations to generate bracket" });
        return;
    }

    db.delete(brackets).where(eq(brackets.tournamentId, tournamentId)).run();

    const bracket = db.insert(brackets).values({ tournamentId, type: t.format }).returning().get();

    let teamIds: number[] = [];

    if (t.participantType === "player") {
        for (const reg of approvedRegs) {
            const userId = reg.userId!;
            const existingTeam = db.select().from(teamMembers)
                .where(eq(teamMembers.userId, userId)).all();
            let soloTeam = existingTeam.length > 0
                ? db.select().from(teams).where(eq(teams.id, existingTeam[0].teamId)).get()
                : null;

            if (!soloTeam) {
                soloTeam = db.insert(teams).values({
                    name: `Solo_${userId}`,
                    tag: `S${userId}`,
                    captainId: userId,
                }).returning().get();
                db.insert(teamMembers).values({ teamId: soloTeam.id, userId, role: "captain" }).run();
            }
            teamIds.push(soloTeam.id);
        }
    } else {
        teamIds = approvedRegs.map((r) => r.teamId || r.userId).filter(Boolean) as number[];
    }

    const shuffled = teamIds.sort(() => Math.random() - 0.5);

    const numRounds = Math.ceil(Math.log2(shuffled.length));
    const roundObjects: { id: number; number: number }[] = [];

    for (let i = 1; i <= numRounds; i++) {
        const round = db.insert(rounds).values({ bracketId: bracket.id, number: i }).returning().get();
        roundObjects.push({ id: round.id, number: i });
    }

    const firstRound = roundObjects[0];
    const matchesInFirstRound = shuffled.length / 2;

    for (let i = 0; i < matchesInFirstRound; i++) {
        const team1 = shuffled[i * 2] || null;
        const team2 = shuffled[i * 2 + 1] || null;
        const inserted = db.insert(matches).values({
            roundId: firstRound.id,
            team1: team1 || null,
            team2: team2 || null,
            status: team2 ? "scheduled" : "bye",
        }).returning().get();

        if (!team2 && team1 && roundObjects.length > 1) {
            const nextRound = roundObjects[1];
            const nextMatches = db.select().from(matches).where(eq(matches.roundId, nextRound.id)).all();
            const targetNextMatch = nextMatches[Math.floor(i / 2)];
            if (targetNextMatch) {
                const slotToUpdate = targetNextMatch.team1 == null ? "team1" : "team2";
                db.update(matches).set({ [slotToUpdate]: team1, status: "scheduled" })
                    .where(eq(matches.id, targetNextMatch.id)).run();
            }
            db.update(matches).set({ winner: team1 }).where(eq(matches.id, inserted.id)).run();
        }
    }

    for (let i = 1; i < roundObjects.length; i++) {
        const matchesInRound = Math.pow(2, numRounds - i - 1);
        for (let j = 0; j < matchesInRound; j++) {
            db.insert(matches).values({
                roundId: roundObjects[i].id,
                team1: null,
                team2: null,
                status: "pending",
            }).run();
        }
    }

    if (t.status === "draft" || t.status === "registration") {
        db.update(tournaments).set({ status: "active" }).where(eq(tournaments.id, tournamentId)).run();
    }

    res.json({ ok: true, bracketId: bracket.id, rounds: roundObjects.length, matchesInFirstRound });
});

router.get("/:id/bracket", authMiddleware, (req: AuthRequest, res: Response) => {
    const tournamentId = Number(req.params.id);
    const bracketList = db.select().from(brackets).where(eq(brackets.tournamentId, tournamentId)).all();
    if (bracketList.length === 0) {
        res.json({ brackets: [] });
        return;
    }

    const result = bracketList.map((b) => {
        const roundList = db.select().from(rounds).where(eq(rounds.bracketId, b.id)).all();
        const roundsWithMatches = roundList.map((r) => {
            const matchList = db.select().from(matches).where(eq(matches.roundId, r.id)).all();
            const enrichedMatches = matchList.map((m) => {
                const t1 = m.team1 ? db.select().from(teams).where(eq(teams.id, m.team1)).get() : null;
                const t2 = m.team2 ? db.select().from(teams).where(eq(teams.id, m.team2)).get() : null;
                return { ...m, team1Name: t1?.name || null, team2Name: t2?.name || null };
            });
            return { ...r, matches: enrichedMatches };
        });
        return { ...b, rounds: roundsWithMatches };
    });

    res.json({ brackets: result });
});

export default router;
