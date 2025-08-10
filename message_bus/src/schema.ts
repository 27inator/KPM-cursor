import { z } from "zod";

export const ScanEvent = z.object({
  event_type: z.string(),
  product_id: z.string(),
  timestamp: z.string().refine(s => !Number.isNaN(Date.parse(s))),
  location: z.string(),
  operator_id: z.string(),
});
export type ScanEvent = z.infer<typeof ScanEvent>;

