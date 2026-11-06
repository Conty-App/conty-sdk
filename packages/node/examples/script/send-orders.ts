import { createConty } from "@conty/node";

const key = process.env.CONTY_EVENT_KEY;
if (!key) throw new Error("Defina CONTY_EVENT_KEY com a chave secreta (cev_...).");

const conty = createConty({ key });

const orders = [
  { id: "pedido-1", totalCents: 15990, utmCampaign: "verao", utmContent: "cr_948643af" },
  { id: "pedido-2", totalCents: 4990, utmCampaign: null, utmContent: null },
];

const { data, error } = await conty.trackBatch(
  orders.map((order) => ({
    event: "purchase",
    external_id: order.id,
    value_cents: order.totalCents,
    utm_campaign: order.utmCampaign,
    utm_content: order.utmContent,
  })),
);

if (error) console.warn(error.code, error.message, `${error.accepted} aceitos antes da falha`);
if (data) console.log(`${data.accepted} eventos aceitos`);
