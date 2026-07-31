/**
 * Field guidance keyed by condition.
 *
 * A class name on its own is useless to a grower — "Tomato · Late Blight" only helps if
 * you know it spreads in cool wet weather and can destroy a crop in under a week. Each
 * entry is deliberately short: what it is, how to confirm it by eye, what to do today,
 * and how to avoid it next season.
 *
 * This is general horticultural information, not a prescription. Product choice and dose
 * are local-regulation and crop-stage dependent, so nothing here names a pesticide dose.
 */

export type Severity = "healthy" | "watch" | "act" | "urgent";

export interface Guidance {
  summary: string;
  confirm: string;
  now: string[];
  prevent: string[];
  severity: Severity;
  spread: string;
}

const HEALTHY: Guidance = {
  summary: "No disease signature detected in this leaf.",
  confirm: "Even colour, no lesions, no powder or curl. Check a few more leaves, especially lower ones.",
  now: [
    "Keep scouting weekly — most outbreaks are cheapest to stop in the first few days.",
    "Photograph a mix of leaves; a single healthy leaf does not clear the whole plant.",
  ],
  prevent: [
    "Water at the base, early in the day, so leaves are dry by night.",
    "Leave room between plants for airflow.",
  ],
  severity: "healthy",
  spread: "—",
};

const GUIDANCE: Record<string, Guidance> = {
  "late blight": {
    summary:
      "Phytophthora infestans. The fastest-moving disease in this list — it can take a tomato or potato crop in under a week in cool, wet weather.",
    confirm:
      "Greasy grey-green to brown patches with an indistinct edge, often a pale halo; white fuzz on the underside in humid mornings. Stems can blacken.",
    now: [
      "Remove and bag affected leaves and fruit — do not compost them.",
      "Stop overhead watering immediately; keep foliage dry.",
      "Treat remaining healthy foliage protectively and check every 2-3 days.",
      "If more than a quarter of the plant is affected, remove the whole plant to protect neighbours.",
    ],
    prevent: [
      "Plant resistant varieties and rotate away from tomato/potato for 2-3 years.",
      "Never save tubers or fruit from an infected plant.",
      "Space and stake for airflow; mulch to stop soil splash.",
    ],
    severity: "urgent",
    spread: "Airborne spores, very fast in cool wet weather (10-24 °C, high humidity).",
  },
  "early blight": {
    summary:
      "Alternaria solani. Works upward from the oldest leaves; rarely kills outright but steadily strips the canopy and shrinks fruit.",
    confirm:
      "Dark spots with concentric rings — a target pattern — surrounded by yellowing, starting on lower leaves.",
    now: [
      "Strip the worst lower leaves and clear debris from the soil surface.",
      "Mulch to stop rain splashing spores back up.",
      "Feed lightly: stressed, hungry plants lose leaves fastest.",
    ],
    prevent: [
      "Rotate crops; the fungus overwinters in residue.",
      "Water at soil level and keep leaves off the ground.",
      "Choose tolerant varieties for humid seasons.",
    ],
    severity: "act",
    spread: "Splash and wind from infected residue; favours warm, humid spells.",
  },
  "bacterial spot": {
    summary:
      "Xanthomonas species. Bacterial, so fungicides do little — management is about wet leaves and clean tools.",
    confirm:
      "Small dark water-soaked specks, sometimes with a yellow halo, that stay angular rather than round; may crack or turn scabby on fruit.",
    now: [
      "Work in the crop only when foliage is dry to avoid spreading bacteria by hand.",
      "Remove badly spotted leaves and any affected fruit.",
      "Disinfect pruners between plants.",
    ],
    prevent: [
      "Use certified clean seed; the bacterium travels on seed.",
      "Avoid overhead irrigation and dense planting.",
      "Rotate away from peppers and tomatoes for two seasons.",
    ],
    severity: "act",
    spread: "Rain splash, wind-driven water and hands/tools; loves warm wet weather.",
  },
  "septoria leaf spot": {
    summary: "Septoria lycopersici. A relentless lower-canopy defoliator in wet summers.",
    confirm:
      "Many small circular spots with grey centres and dark margins; tiny black dots (spore cases) visible in the centre with a hand lens.",
    now: [
      "Remove the lowest affected leaves, then mulch the soil surface.",
      "Improve airflow — thin dense growth rather than shearing everything.",
    ],
    prevent: [
      "Clear all debris at the end of the season.",
      "Rotate and avoid working in the crop when wet.",
    ],
    severity: "act",
    spread: "Splash from soil and residue; needs long leaf-wetness periods.",
  },
  "leaf mold": {
    summary: "Passalora fulva. A greenhouse and polytunnel specialist — humidity is the whole story.",
    confirm: "Pale yellow blotches on top, olive-brown velvety mould directly beneath them.",
    now: [
      "Ventilate hard: drop humidity below about 85% and it stalls.",
      "Remove affected leaves and increase spacing.",
    ],
    prevent: ["Vent early each morning.", "Avoid wetting foliage.", "Grow resistant cultivars under cover."],
    severity: "act",
    spread: "Airborne spores in still, humid air; rare outdoors in dry climates.",
  },
  "target spot": {
    summary: "Corynespora cassiicola. Attacks leaves, stems and fruit, so damage adds up quickly.",
    confirm: "Brown spots with light centres and faint rings, often with a yellow halo; pitted fruit lesions.",
    now: ["Remove affected tissue and improve airflow.", "Keep fruit off wet soil."],
    prevent: ["Rotate, sanitise stakes and ties, and avoid dense canopies."],
    severity: "act",
    spread: "Wind and splash in warm, humid conditions.",
  },
  "spider mites or two-spotted spider mite": {
    summary:
      "Tetranychus urticae — a mite, not a disease. Populations explode in hot, dry, dusty conditions.",
    confirm:
      "Fine pale stippling that becomes bronzed; fine webbing under leaves; specks move when you tap a leaf over white paper.",
    now: [
      "Hose the undersides of leaves forcefully — physical removal works.",
      "Raise humidity and remove dusty, stressed growth.",
      "If treating, use a miticide rated for mites; broad insecticides kill their predators and make it worse.",
    ],
    prevent: [
      "Do not let plants run dry and dusty.",
      "Protect predatory mites and ladybirds by avoiding blanket sprays.",
    ],
    severity: "act",
    spread: "Crawls and blows between plants; generations in under a week when hot.",
  },
  "yellow leaf curl virus": {
    summary:
      "TYLCV. Viral and incurable in the plant — the job is protecting the rest of the crop from whiteflies.",
    confirm: "Upward-curling, cupped leaves, yellow margins, stunted growth with poor fruit set.",
    now: [
      "Remove and bag infected plants; do not leave them wilting in place.",
      "Control whiteflies — yellow sticky traps first, to gauge pressure.",
    ],
    prevent: [
      "Use resistant varieties in whitefly regions.",
      "Insect-proof netting on nursery beds.",
      "Clear weed hosts around the plot.",
    ],
    severity: "urgent",
    spread: "Whitefly (Bemisia tabaci) only — it does not spread by touch.",
  },
  "mosaic virus": {
    summary: "Tobamovirus (TMV/ToMV). Extremely stable and transmitted mechanically — hands and tools spread it.",
    confirm: "Mottled light/dark green marbling, fern-like or thread-like distorted leaves; growth slows.",
    now: [
      "Remove affected plants and wash hands and tools thoroughly.",
      "Handle healthy plants before suspect ones, never the reverse.",
      "Do not smoke or handle tobacco around solanaceous crops.",
    ],
    prevent: ["Use certified seed and resistant varieties.", "Disinfect stakes, ties and blades between seasons."],
    severity: "urgent",
    spread: "Touch, tools, seed and debris. Survives long periods on surfaces.",
  },
  "black rot": {
    summary: "Guignardia bidwellii on grape, Botryosphaeria on apple. Fruit losses can be total in wet springs.",
    confirm:
      "Circular tan leaf lesions with dark borders and black pinpoint dots; fruit shrivels to a hard black mummy.",
    now: [
      "Remove every mummified fruit and cankered shoot — they are next year's inoculum.",
      "Open the canopy so fruit dries quickly after rain.",
    ],
    prevent: [
      "Sanitise thoroughly in winter; the fungus overwinters in mummies and canes.",
      "Protect from bud break through fruit set in wet regions.",
    ],
    severity: "act",
    spread: "Rain-splashed spores from mummies and cankers.",
  },
  scab: {
    summary: "Venturia inaequalis on apple. The defining apple disease of wet springs; it disfigures fruit rather than killing trees.",
    confirm: "Olive-green velvety blotches on leaves that turn dark and puckered; corky scabs on fruit.",
    now: ["Rake and remove fallen leaves — that is where it overwinters.", "Thin the canopy for faster drying."],
    prevent: [
      "Grow scab-resistant cultivars where possible.",
      "Time protection to the primary infection window at bud break.",
    ],
    severity: "watch",
    spread: "Spores released from last year's fallen leaves during spring rain.",
  },
  "cedar apple rust": {
    summary:
      "Gymnosporangium juniperi-virginianae. Needs both an apple and a juniper/cedar nearby to complete its life cycle.",
    confirm: "Bright yellow-orange spots on upper leaf surfaces, later with orange tube-like structures beneath.",
    now: ["Remove galls from nearby junipers if you can reach them.", "Remove the worst-affected leaves."],
    prevent: [
      "Do not plant susceptible apples within a few hundred metres of junipers.",
      "Choose resistant cultivars.",
    ],
    severity: "watch",
    spread: "Spores blow from juniper galls to apple in spring rain.",
  },
  "common rust": {
    summary: "Puccinia sorghi on maize. Usually cosmetic; heavy early infection cuts yield.",
    confirm: "Small cinnamon-brown pustules on both leaf surfaces that rub off orange onto a finger.",
    now: ["Note the growth stage — rust before tasselling matters, after it rarely does.", "Keep plants unstressed."],
    prevent: ["Plant resistant hybrids and avoid very late plantings in humid areas."],
    severity: "watch",
    spread: "Wind-blown spores over long distances; needs cool, humid nights.",
  },
  "northern leaf blight": {
    summary: "Exserohilum turcicum on maize. Long lesions that can strip the canopy before grain fill.",
    confirm: "Long cigar-shaped grey-green to tan lesions running with the veins, 3-15 cm.",
    now: ["Check how close lesions are to the ear leaf — that decides whether treatment pays.", "Avoid dense stands."],
    prevent: ["Resistant hybrids, rotation and residue management."],
    severity: "act",
    spread: "Splash and wind from residue; favours moderate temperatures with long dews.",
  },
  "cercospora and gray leaf spot": {
    summary: "Cercospora zeae-maydis on maize. Thrives in continuous maize under heavy residue.",
    confirm: "Narrow rectangular grey-tan lesions with parallel sides, running strictly between veins.",
    now: ["Assess the ear leaf; treat only if lesions are climbing towards it before grain fill."],
    prevent: ["Rotate out of maize, manage residue, and pick tolerant hybrids."],
    severity: "act",
    spread: "Residue-borne, needs long humid periods.",
  },
  "powdery mildew": {
    summary: "Several fungi (Podosphaera, Erysiphe). Unusual in that it prefers dry leaves with humid air.",
    confirm: "White talcum-like coating that wipes off, on upper surfaces first; leaves may distort or yellow.",
    now: [
      "Remove the worst leaves and improve airflow.",
      "Avoid high-nitrogen pushes: soft new growth is the most susceptible.",
    ],
    prevent: ["Space plants, grow resistant varieties, and water at the base in the morning."],
    severity: "watch",
    spread: "Airborne spores; does not need leaf wetness, only humidity.",
  },
  "isariopsis leaf spot": {
    summary: "Pseudocercospora vitis on grape. Mostly a late-season defoliator.",
    confirm: "Irregular dark brown angular blotches, often merging, with dusty grey growth beneath.",
    now: ["Remove affected leaves and open the canopy.", "Clear fallen leaves at the end of the season."],
    prevent: ["Canopy management and winter sanitation."],
    severity: "watch",
    spread: "Splash and wind in warm humid weather.",
  },
  "esca (black measles)": {
    summary: "A wood-decay complex in grapevine (Phaeomoniella, Phaeoacremonium). Structural, not a leaf-only problem.",
    confirm: "Tiger-stripe interveinal yellowing/reddening between green veins; dark spotting on berries; dead arms.",
    now: [
      "Mark affected vines and prune them last, in dry weather.",
      "Remove and burn dead wood; disinfect pruning cuts.",
    ],
    prevent: [
      "Prune late and dry, seal large wounds, and avoid big cuts on young vines.",
      "There is no cure — vineyard hygiene is the whole strategy.",
    ],
    severity: "urgent",
    spread: "Spores enter through pruning wounds; symptoms appear years later.",
  },
  "citrus greening": {
    summary:
      "Huanglongbing (Candidatus Liberibacter). The most serious citrus disease worldwide; infected trees do not recover.",
    confirm:
      "Blotchy asymmetric yellowing that ignores the midrib, corky veins, lopsided small fruit with bitter juice.",
    now: [
      "Report it — HLB is a regulated disease in most citrus regions.",
      "Do not move plant material off the property.",
      "Control psyllids on the remaining trees.",
    ],
    prevent: ["Plant certified stock, monitor for Asian citrus psyllid, and remove infected trees promptly."],
    severity: "urgent",
    spread: "Asian citrus psyllid and infected grafting material.",
  },
  "leaf scorch": {
    summary: "Diplocarpon earlianum on strawberry. Reduces vigour and next season's crown quality.",
    confirm: "Many small purple blotches that merge until the leaf looks scorched; veins stay darker.",
    now: ["Remove old infected foliage after harvest.", "Water at the base and thin crowded rows."],
    prevent: ["Renovate beds after harvest, use resistant cultivars, and avoid overhead irrigation."],
    severity: "watch",
    spread: "Splash from infected leaf debris in warm wet weather.",
  },
};

const ALIASES: Record<string, string> = {
  healthy: "healthy",
  "gray leaf spot": "cercospora and gray leaf spot",
  "leaf blight": "northern leaf blight",
  rust: "common rust",
  "black measles": "esca (black measles)",
};

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9() ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function guidanceFor(condition: string, healthy: boolean): Guidance {
  if (healthy) return HEALTHY;
  const key = normalise(condition);
  if (GUIDANCE[key]) return GUIDANCE[key];
  const alias = ALIASES[key];
  if (alias === "healthy") return HEALTHY;
  if (alias && GUIDANCE[alias]) return GUIDANCE[alias];
  const partial = Object.keys(GUIDANCE).find((k) => key.includes(k) || k.includes(key));
  if (partial) return GUIDANCE[partial];
  return {
    summary: `${condition} was detected. No field notes are bundled for this condition yet.`,
    confirm: "Compare with a second reference before acting.",
    now: ["Isolate affected material.", "Ask a local extension service to confirm."],
    prevent: ["Rotate crops, water at the base, and keep tools clean."],
    severity: "act",
    spread: "Unknown",
  };
}

export const SEVERITY_META: Record<Severity, { label: string; tone: string; ring: string }> = {
  healthy: { label: "Healthy", tone: "text-leaf-700 bg-leaf-100 border-leaf-300", ring: "bg-leaf-500" },
  watch: { label: "Monitor", tone: "text-sun-600 bg-sun-100 border-sun-500/40", ring: "bg-sun-500" },
  act: { label: "Act this week", tone: "text-clay-700 bg-clay-100 border-clay-500/40", ring: "bg-clay-500" },
  urgent: { label: "Act today", tone: "text-white bg-clay-700 border-clay-700", ring: "bg-clay-700" },
};
