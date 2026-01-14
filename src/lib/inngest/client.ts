// Inngest client configuration

import { Inngest, EventSchemas } from 'inngest';

// Event type definitions for type safety
export type AnalyzeRequestedEvent = {
  data: {
    jobId: string;
    csvContent: string;
    fileType: 'csv' | 'pdf';
    fileName: string;
  };
};

// Define all events for the app
type Events = {
  'analyze.requested': AnalyzeRequestedEvent;
};

// Create the Inngest client with typed events
export const inngest = new Inngest({
  id: 'cancelit',
  schemas: new EventSchemas().fromRecord<Events>(),
});
