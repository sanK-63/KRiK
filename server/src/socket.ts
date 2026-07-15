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

export function broadcast(event: string, data: any) {
    getIO().emit(event, data);
}
