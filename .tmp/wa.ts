import { notify, WHATSAPP_ENABLED } from "@/lib/agents/wassist";
async function main() {
  console.log("enabled:", WHATSAPP_ENABLED, "to:", process.env.MERCHANT_WHATSAPP_NUMBER);
  const r = await notify(process.env.MERCHANT_WHATSAPP_NUMBER!, "Autopilot test: price approval path check.");
  console.log(JSON.stringify(r));
}
main();
