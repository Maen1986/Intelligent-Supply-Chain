/* Hand-written schemas for the Customer Voice feedback API.
   (The generated/ directory is orval output — do not add manual schemas there.) */
import * as zod from 'zod';

export const FeedbackCreateSchema = zod.object({
  tool:         zod.string().min(1).max(50),
  rating:       zod.number().int().min(1).max(5),
  nps:          zod.number().int().min(0).max(10).optional(),
  comment:      zod.string().max(5000).optional(),
  sentiment:    zod.enum(['positive', 'neutral', 'negative']).optional(),
  company:      zod.string().max(200).optional(),
  submissionId: zod.number().int().positive().optional(),
});

export type FeedbackCreate = zod.infer<typeof FeedbackCreateSchema>;
