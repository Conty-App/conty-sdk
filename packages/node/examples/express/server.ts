import { createConty } from "@conty/node";
import express from "express";

interface PaidOrder {
  id: string;
  totalCents: number;
  utmCampaign: string | null;
  utmContent: string | null;
}

const key = process.env.CONTY_EVENT_KEY;
if (!key) throw new Error("Defina CONTY_EVENT_KEY com a chave secreta (cev_...).");

const conty = createConty({
  key,
  maxRetries: 3,
  onError: (error) => console.warn("conty", error.code, error.message),
});

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function readOrder(body: unknown): PaidOrder | null {
  if (typeof body !== "object" || body === null) return null;
  const id: unknown = Reflect.get(body, "id");
  const totalCents: unknown = Reflect.get(body, "totalCents");
  if (typeof id !== "string" || !id) return null;
  if (typeof totalCents !== "number" || !Number.isInteger(totalCents)) return null;
  return {
    id,
    totalCents,
    utmCampaign: optionalText(Reflect.get(body, "utmCampaign")),
    utmContent: optionalText(Reflect.get(body, "utmContent")),
  };
}

const app = express();

app.post("/webhooks/pagamento", express.json(), async (request, response) => {
  const order = readOrder(request.body);
  if (!order) {
    response.status(400).json({ ok: false });
    return;
  }
  const { data } = await conty.track({
    event: "purchase",
    external_id: order.id,
    value_cents: order.totalCents,
    utm_campaign: order.utmCampaign,
    utm_content: order.utmContent,
    properties: { currency: "BRL" },
  });
  response.json({ ok: true, accepted: data?.accepted ?? 0 });
});

app.listen(3000);
