export const API = import.meta.env.VITE_API_URL;
export const PAGE_SIZE = 30;
export const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👋", "🔥"];

export interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string | null;
    attachmentPath: string | null;
    attachmentName: string | null;
    replyToId: number | null;
    forwardedFromId: number | null;
    editedAt: string | null;
    createdAt: string;
    sender?: { id: number; username: string; displayName: string | null; avatar: string | null };
    reactions?: { emoji: string; userIds: number[] }[];
    replyTo?: { id: number; content: string | null; sender?: { id: number; displayName: string | null; username: string } | null; attachmentName: string | null } | null;
    forwardedFrom?: { id: number; displayName: string | null; username: string } | null;
}

export interface Participant {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
}

export interface ConversationInfo {
    id: number;
    title: string | null;
    isGroup: boolean;
    avatar: string | null;
    createdBy: number;
    participants: Participant[];
}

export interface ChatWindowProps {
    conversationId: number;
    onBack: () => void;
    onOpenSettings?: () => void;
}

export interface Conversation {
    id: number;
    title: string | null;
    isGroup: boolean;
    avatar: string | null;
    createdAt: string;
    createdBy: number;
    otherUser: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
    otherUsers?: { id: number; username: string; displayName: string | null; avatar: string | null }[];
    lastMessage: { content: string | null; senderId: number; createdAt: string; attachmentName: string | null } | null;
    unreadCount: number;
    participantCount?: number;
}

export interface User {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
}
