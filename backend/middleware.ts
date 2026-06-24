import type { NextFunction, Request, Response } from "express";
import { supabase } from "./supabase";
import type { AuthProvider } from "./prisma/generated/enums";
import { prisma } from "./db";

export default async function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (!data.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
    }

    try {
        await prisma.user.upsert({
            where: { id: data.user.id },
            update: {
                email: data.user.email!,
                name: data.user.user_metadata.name || "",
            },
            create: {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata.name || "",
                provider: data.user.app_metadata.provider as AuthProvider,
            }
        });
    } catch (error) {
        console.error("Failed to sync user state with database:", error);
    }
    (req as any).userId = data.user?.id;
    next();
}   