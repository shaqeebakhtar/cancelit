// Inngest webhook handler route

import { serve } from 'inngest/next';
import { inngest, analyzeFunction } from '@/lib/inngest';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeFunction],
});
