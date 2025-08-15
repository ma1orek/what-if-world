// /server/services/validatorService.js
const { Scenario } = require("../../shared/schemas");
const { asISO } = require("../../shared/gazetteer");

function normalizeISO(ops) {
  return (ops || []).map(op => {
    if (op?.op === "highlight_region") op.args.iso_a3 = op.args.iso_a3.map(asISO);
    if (op?.op === "shift_border") { op.args.from = asISO(op.args.from); op.args.to = asISO(op.args.to); }
    return op;
  });
}

function plausibilityPass(generated) {
  // 1) sort timeline
  generated.scenario.timeline.sort((a,b)=>a.year-b.year);

  // 2) clamp coords (lat:-90..90, lon:-180..180)
  generated.scenario.timeline.forEach(ev=>{
    ev.geoPoints = (ev.geoPoints||[]).map(([lat,lon])=>[
      Math.max(-90, Math.min(90, lat)),
      Math.max(-180, Math.min(180, lon))
    ]);
  });

  // 3) normalize ISO codes in ops
  generated.ops = normalizeISO(generated.ops);

  // 4) validate types
  Scenario.parse(generated.scenario);
  return generated;
}

module.exports = { plausibilityPass };