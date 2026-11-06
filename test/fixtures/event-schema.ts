import { EVENT, UTM } from "@conty/core";
import { z } from "zod";

const noNul = (value: string) => !value.includes("\u0000");
const text = (max: number) => z.string().trim().min(1).max(max).refine(noNul);
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const noNulDeep = (value: unknown) => {
  let clean = true;
  JSON.stringify(value, (key, item) => {
    clean &&= noNul(key) && (typeof item !== "string" || noNul(item));
    return item;
  });
  return clean;
};

export const BrandEventSchema = z.object({
  event: z.string().max(EVENT.name.max).regex(EVENT.name.pattern),
  occurred_at: z.iso.datetime({ offset: true }),
  external_id: z.string().min(1).max(EVENT.externalId.max).refine(noNul).optional(),
  link_code: text(EVENT.linkCode.max).optional(),
  utm_campaign: text(UTM.maxLength).optional(),
  utm_content: text(UTM.maxLength).optional(),
  value_cents: z.number().int().min(0).max(EVENT.valueCents.max).optional(),
  properties: z
    .record(z.string(), z.unknown())
    .refine((properties) => bytes(properties) <= EVENT.properties.maxBytes)
    .refine(noNulDeep)
    .optional(),
});

export const BrandEventBatchSchema = z.object({
  events: z.array(BrandEventSchema).min(1).max(EVENT.batch.max),
});
