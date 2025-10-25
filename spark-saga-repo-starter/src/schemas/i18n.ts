import { z } from 'zod';

export const i18nSchema = z.record(z.string(), z.string());
