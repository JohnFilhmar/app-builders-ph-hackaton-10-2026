import { z } from 'zod';

export const boardRowSchema = z.object({ rank: z.number().int(), username: z.string(), xp: z.number(), level: z.number().int() });

/** GET /lb from the team server: the top rows, the asking player's own row, and how many players there are. */
export const boardSchema = z.object({
  period: z.enum(['week', 'all']),
  rows: z.array(boardRowSchema),
  me: boardRowSchema.nullable(),
  players: z.number().int(),
});

export type BoardRow = z.infer<typeof boardRowSchema>;
export type Board = z.infer<typeof boardSchema>;
export type BoardPeriod = Board['period'];
