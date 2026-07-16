import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config";

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            socket.data.user = null;
            return next();
        }
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as { id: number };
            socket.data.user = decoded;
            next();
        } catch {
            socket.data.user = null;
            next();
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user;
        if (user) {
            socket.join(`user:${user.id}`);
            console.log(`[Socket] User ${user.id} connected: ${socket.id}`);
        } else {
            console.log(`[Socket] Anonymous connected: ${socket.id}`);
        }

        socket.on("disconnect", () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });

        socket.on("conversation:join", (data: { conversationId: number }) => {
            if (user && data.conversationId) {
                socket.join(`conversation:${data.conversationId}`);
                console.log(`[Socket] User ${user.id} joined conversation ${data.conversationId}`);
            }
        });

        socket.on("conversation:leave", (data: { conversationId: number }) => {
            if (user && data.conversationId) {
                socket.leave(`conversation:${data.conversationId}`);
                console.log(`[Socket] User ${user.id} left conversation ${data.conversationId}`);
            }
        });

        socket.on("conversation:typing", (data: { conversationId: number; isTyping: boolean }) => {
            if (user && data.conversationId) {
                try {
                    socket.to(`conversation:${data.conversationId}`).emit("conversation:typing", {
                        conversationId: data.conversationId,
                        userId: user.id,
                        isTyping: data.isTyping,
                    });
                } catch {}
            }
        });

        // WebRTC signaling — test
        socket.on("call:test-offer", (data: { targetUserId: number; sdp: any }) => {
            if (user && data.targetUserId) {
                emitToUser(data.targetUserId, "call:test-offer", { fromUserId: user.id, sdp: data.sdp });
            }
        });
        socket.on("call:test-answer", (data: { targetUserId: number; sdp: any }) => {
            if (user && data.targetUserId) {
                emitToUser(data.targetUserId, "call:test-answer", { fromUserId: user.id, sdp: data.sdp });
            }
        });
        socket.on("call:test-ice", (data: { targetUserId: number; candidate: any }) => {
            if (user && data.targetUserId) {
                emitToUser(data.targetUserId, "call:test-ice", { fromUserId: user.id, candidate: data.candidate });
            }
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) throw new Error("Socket.IO not initialized");
    return io;
}

export function emitToUser(userId: number, event: string, data: any) {
    getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToConversation(conversationId: number, event: string, data: any) {
    getIO().to(`conversation:${conversationId}`).emit(event, data);
}

export function broadcast(event: string, data: any) {
    getIO().emit(event, data);
}
