import { z } from 'zod'

export const itemSchema = z.object({
  id: z.union([z.number().int().positive().nullable(), z.literal('')]),
  name: z.string().min(1).max(20),
})
