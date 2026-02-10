import { z } from 'zod';

// ─── Auth ───

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  firstName: z.string().min(1, 'Prénom requis').transform((s) => s.trim()),
  sectors: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

export const setPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});

// ─── Shared primitives ───

/** SIREN: exactly 9 digits */
export const sirenSchema = z.string().regex(/^\d{9}$/, 'SIREN invalide (9 chiffres)');

/** SIRET: exactly 14 digits */
export const siretSchema = z.string().regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)');

/** Non-empty trimmed string */
const nonEmpty = z.string().min(1).transform((s) => s.trim());

// ─── AI: generate-section ───

export const generateSectionSchema = z.object({
  sectionTitle: nonEmpty,
  buyerExpectation: nonEmpty,
  dceContext: z.string().default(''),
  companyProfile: z.object({
    companyName: nonEmpty,
    sectors: z.array(z.string()).default([]),
    references: z.array(z.object({
      client: z.string(),
      title: z.string(),
      amount: z.string(),
      period: z.string(),
    })).default([]),
    team: z.array(z.object({
      name: z.string(),
      role: z.string(),
      certifications: z.array(z.string()).default([]),
      experience: z.number(),
    })).default([]),
    caN1: z.string().default(''),
    caN2: z.string().default(''),
    caN3: z.string().default(''),
  }),
  options: z.object({
    tone: z.enum(['formal', 'standard']).optional(),
    length: z.enum(['short', 'medium', 'detailed']).optional(),
  }).optional(),
});

export type GenerateSectionInput = z.infer<typeof generateSectionSchema>;

// ─── AI: coach ───

export const coachSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    aiDraft: z.string().default(''),
    buyerExpectation: z.string().default(''),
  })).min(1, 'Au moins une section requise'),
  profile: z.object({
    companyName: nonEmpty,
    sectors: z.array(z.string()).default([]),
    references: z.array(z.object({
      client: z.string(),
      title: z.string(),
      amount: z.string(),
      period: z.string(),
    })).default([]),
    team: z.array(z.object({
      name: z.string(),
      role: z.string(),
      certifications: z.array(z.string()).default([]),
      experience: z.number(),
    })).default([]),
    caN1: z.string().default(''),
    caN2: z.string().default(''),
    caN3: z.string().default(''),
  }),
  dceContext: z.string().default(''),
  selectionCriteria: z.array(z.object({
    name: z.string(),
    weight: z.number(),
  })).default([]),
});

export type CoachInput = z.infer<typeof coachSchema>;

// ─── Alerts ───

export const alertCreateSchema = z.object({
  label: z.string().max(200).default(''),
  cpv_sectors: z.array(z.string()).max(20).default([]),
  regions: z.array(z.string()).max(20).default([]),
  keywords: z.array(z.string()).max(50).default([]),
  amount_min: z.number().min(0).default(0),
  amount_max: z.number().min(0).default(0),
  notify_email: z.boolean().default(true),
  notify_inapp: z.boolean().default(true),
});

export const alertUpdateSchema = z.object({
  id: z.string().uuid(),
  label: z.string().max(200).optional(),
  cpv_sectors: z.array(z.string()).max(20).optional(),
  regions: z.array(z.string()).max(20).optional(),
  keywords: z.array(z.string()).max(50).optional(),
  amount_min: z.number().min(0).optional(),
  amount_max: z.number().min(0).optional(),
  notify_email: z.boolean().optional(),
  notify_inapp: z.boolean().optional(),
  active: z.boolean().optional(),
});

// ─── Pipeline ───

const PIPELINE_STAGES = ['detected', 'qualified', 'dce_analyzed', 'drafting', 'submitted', 'result'] as const;
const SCORE_LABELS = ['GO', 'MAYBE', 'PASS'] as const;

export const pipelineCreateSchema = z.object({
  ao_id: z.string().min(1),
  ao_title: z.string().default(''),
  ao_issuer: z.string().default(''),
  ao_budget: z.number().nullable().default(null),
  ao_deadline: z.string().nullable().default(null),
  ao_score: z.number().min(0).max(100).nullable().default(null),
  ao_score_label: z.enum(SCORE_LABELS).nullable().default(null),
});

export const pipelineUpdateSchema = z.object({
  stage: z.enum(PIPELINE_STAGES).optional(),
  position: z.number().int().min(0).optional(),
  tags: z.array(z.string()).max(20).optional(),
  notes: z.string().max(5000).optional(),
  result: z.enum(['won', 'lost', 'abandoned']).nullable().optional(),
  submitted_at: z.string().nullable().optional(),
});

// ─── Watchlist ───

export const watchlistCreateSchema = z.object({
  buyer_name: nonEmpty,
  buyer_siret: z.string().optional(),
});

// ─── Feedback ───

export const feedbackSchema = z.object({
  category: z.enum(['bug', 'idea', 'other']),
  message: z.string().min(1).max(2000),
  pageUrl: z.string().url().optional().nullable(),
});

// ─── Settings ───

export const settingsUpdateSchema = z.object({
  display_name: z.string().max(100).optional(),
  default_cpv: z.array(z.string()).max(20).optional(),
  default_regions: z.array(z.string()).max(20).optional(),
  default_keywords: z.array(z.string()).max(50).optional(),
  amount_min: z.number().min(0).optional(),
  amount_max: z.number().min(0).optional(),
  notify_frequency: z.enum(['instant', 'daily', 'weekly']).optional(),
  notify_email: z.boolean().optional(),
});

// ─── Parse helper ───

/** Parse request body with Zod schema. Returns parsed data or a 400 Response. */
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown):
  | { ok: true; data: T }
  | { ok: false; response: Response } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  return {
    ok: false,
    response: new Response(
      JSON.stringify({ error: 'Donnees invalides', details: errors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    ),
  };
}
