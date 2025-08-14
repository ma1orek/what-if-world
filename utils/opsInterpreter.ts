// /utils/opsInterpreter.ts
import { applyMapOp } from "@/components/AnimatedMapSVG";

export async function runOpsSequential(svgRoot: SVGGElement, projection: any, ops: any[]) {
  for (let i = 0; i < (ops || []).length; i++) {
    applyMapOp(svgRoot, projection, ops[i]);
    await new Promise(r => setTimeout(r, 350));
  }
}