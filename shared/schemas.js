// /shared/schemas.js
const { z } = require("zod");

const GeoPoint = z.tuple([z.number(), z.number()]); // [lat, lon]

const TimelineEvent = z.object({
  year: z.number(),
  title: z.string(),
  description: z.string(),
  geoPoints: z.array(GeoPoint).default([]),
});

const Scenario = z.object({
  summary: z.string(),
  timeline: z.array(TimelineEvent).min(1),
  geoChanges: z.array(z.any()).default([]), // GeoJSON Feature/MultiPolygon
});

const OpHighlight = z.object({
  op: z.literal("highlight_region"),
  args: z.object({ iso_a3: z.array(z.string().length(3)) }),
});

const OpFocus = z.object({
  op: z.literal("focus_camera"),
  args: z.object({ lat: z.number(), lon: z.number(), scale: z.number().default(2.0) }),
});

const OpPlace = z.object({
  op: z.literal("place_marker"),
  args: z.object({ lat: z.number(), lon: z.number(), label: z.string().optional() }),
});

const OpShift = z.object({
  op: z.literal("shift_border"),
  args: z.object({
    from: z.string().length(3),
    to: z.string().length(3),
    polygon: z.any(), // GeoJSON Polygon
  }),
});

const OpMerge = z.object({
  op: z.literal("merge_regions"),
  args: z.object({ from: z.array(z.string().length(3)), new_tag: z.string() }),
});

const OpSplit = z.object({
  op: z.literal("split_region"),
  args: z.object({ iso_a3: z.string().length(3), new_polygons: z.array(z.any()) }),
});

const HistoryOp = z.union([OpHighlight, OpFocus, OpPlace, OpShift, OpMerge, OpSplit]);

const HistoryOps = z.object({
  ops: z.array(HistoryOp).default([]),
});

const GenerationPayload = z.object({
  scenario: Scenario,
  ops: z.array(HistoryOp).default([]),
});

const PatchPayload = z.object({
  patch: z.array(z.any()).default([]), // RFC6902
  ops: z.array(HistoryOp).default([]),
});

module.exports = {
  TimelineEvent,
  Scenario,
  GenerationPayload,
  PatchPayload,
  HistoryOp,
};