import { buildNarrativeStaircase } from "./src/lib/llm/narrative-engine";

const shapeNames = ["direto","deslocado","silencio","padrao","reframe","objeto","conversa","corpo","camadas","confissao","depois","universal"];

// Use varied seeds to hit all 12 shapes
const seeds = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(s => s - 7);

for (const seed of seeds) {
  const r = buildNarrativeStaircase("Air Fryer Mondial", "https://shopee.com.br/i.123.456", seed);
  const si = Math.abs(seed + 7) % 12;
  process.stdout.write(`[${si}] ${shapeNames[si]}: ${r.posts.length} posts | pos ${r.productPosition} | ${r.productStrategy}\n`);
  process.stdout.write(`  > ${r.hook.substring(0, 72)}\n\n`);
}
