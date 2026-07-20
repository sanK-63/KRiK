import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Username: only letters, numbers, underscores"),
    displayName: z.string().min(1, "Display name required").max(50),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const keyLoginSchema = z.object({
    key: z.string().min(1, "Key is required"),
});

export const changeEmailSchema = z.object({
    newEmail: z.string().email("Invalid email"),
});

export const createPostSchema = z.object({
    title: z.string().min(1, "Title required").max(200),
    content: z.string().min(1, "Content required").max(50000),
    category: z.enum(["general", "tech", "events", "announcements", "offtopic"]).default("general"),
    tags: z.array(z.string()).optional(),
    pollOptions: z.array(z.string().min(1)).min(2).optional(),
});

export const createEventSchema = z.object({
    title: z.string().min(1, "Title required").max(200),
    description: z.string().min(1, "Description required").max(10000),
    category: z.enum(["tournament", "meeting", "update", "release", "bootcamp", "drinking", "work_task", "other"]),
    date: z.string().min(1, "Date required"),
    time: z.string().optional(),
    location: z.string().optional(),
    video: z.string().optional(),
});

export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(5000),
});
