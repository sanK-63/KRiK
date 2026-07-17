export function avatarUrl(avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    return avatar;
}

export function avatarInitial(name: string | null | undefined, fallback: string = "?"): string {
    return (name?.[0] || fallback).toUpperCase();
}
