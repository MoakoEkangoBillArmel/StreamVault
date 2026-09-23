import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const MediaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.enum(['MOVIE', 'SERIES', 'EPISODE']),
  url: z.string(),
});

export type Media = z.infer<typeof MediaSchema>;
