import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = (error as ZodError).issues.map((e) => `${e.path.join(".")}: ${e.message}`);
                res.status(400).json({ error: "Validation failed", details: messages });
                return;
            }
            next(error);
        }
    };
}
