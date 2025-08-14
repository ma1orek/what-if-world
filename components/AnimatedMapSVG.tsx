import React, { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";

type MapAPI = {
  focus:(lat:number, lon:number, scale?:number)=>void;
  marker:(lat:number, lon:number, label?:string, active?:boolean)=>string; // returns id
  setActiveMarker:(id:string|null)=>void;
  showWaveform:(id:string, on:boolean)=>void;
  link:(fromId:string, toId:string, opts?:{fade?:boolean, dashed?:boolean, duration?:number, geodesic?:boolean, mode?:"auto"|"bezier"|"geodesic"})=>void;
  clearLinks:()=>void;
  highlight:(geo:any)=>void;
  reset:(opts?:{hard?:boolean})=>void;
};

type MarkerData = { id:string; x:number; y:number; chipBBox?:DOMRect };

const AnimatedMapSVG = forwardRef<MapAPI, {}>(function AnimatedMapSVG(_props, ref){
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement|null>(null);
  const projectionRef = useRef<d3.GeoProjection|null>(null);
  const inited = useRef(false);
  const markerIdSeq = useRef(0);
  const markersMap = useRef<Map<string, MarkerData>>(new Map());

  useEffect(() => {
    if (inited.current || !svgRef.current) return;
    inited.current = true;

    const svg = d3.select(svgRef.current);
    const W = svgRef.current.clientWidth || window.innerWidth;
    const H = svgRef.current.clientHeight || window.innerHeight;
    svg.attr("viewBox", `0 0 ${W} ${H}`);

    // załaduj z public/
    Promise.all([
      fetch("/data/land-110m.json").then(r=>r.json()),
      fetch("/data/countries-110m.json").then(r=>r.json()),
    ]).then(([land110m, countries110m])=>{
      const landFC = feature(land110m, land110m.objects.land) as any;
      const bordersMesh = mesh(countries110m, countries110m.objects.countries, (a:any,b:any)=>a!==b);

      const projection = d3.geoNaturalEarth1().fitSize([W,H], landFC);
      const path = d3.geoPath(projection);
      projectionRef.current = projection;

      const g = svg.append("g").attr("class","root").node() as SVGGElement;
      gRef.current = g;
      const sel = d3.select(g);
      const defs = sel.append("defs");

      // domyślny gradient do fade na linkach
      defs.append("linearGradient")
        .attr("id","_linkGradDefault").attr("gradientUnits","objectBoundingBox")
        .selectAll("stop").data([
          {o:"0% ", c:"rgba(245,200,74,0)"},
          {o:"50%", c:"rgba(245,200,74,.9)"},
          {o:"100%",c:"rgba(245,200,74,0)"}
        ]).enter().append("stop")
        .attr("offset", d=>d.o).attr("stop-color", d=>d.c);

      // graticule
      sel.append("path")
        .attr("d", (path as any)(d3.geoGraticule10()))
        .attr("fill","none").attr("stroke","#2b2b2f").attr("stroke-width",0.6).attr("opacity",0.35)
        .attr("vector-effect","non-scaling-stroke");

      // ląd
      sel.append("path")
        .datum(landFC)
        .attr("d", path as any)
        .attr("fill","none")
        .attr("stroke","var(--stroke, #f4f4f4)")
        .attr("stroke-width",1.25)
        .attr("stroke-linejoin","round")
        .attr("stroke-linecap","round")
        .attr("vector-effect","non-scaling-stroke")
        .attr("stroke-dasharray", function(){ const l=(this as SVGPathElement).getTotalLength(); return `${l} ${l}`; })
        .attr("stroke-dashoffset", function(){ return (this as SVGPathElement).getTotalLength(); })
        .transition().duration(900).attr("stroke-dashoffset",0);

      // granice
      sel.append("path")
        .datum(bordersMesh as any)
        .attr("d", path as any)
        .attr("fill","none").attr("stroke","var(--stroke-sub, #6e6e78)")
        .attr("stroke-width",0.6).attr("opacity",0.35).attr("vector-effect","non-scaling-stroke");

      // warstwy
      sel.append("g").attr("class","links");
      sel.append("g").attr("class","changes");
      sel.append("g").attr("class","markers");

      // filter glow
      const f = defs.append("filter").attr("id","glow");
      f.append("feGaussianBlur").attr("stdDeviation","2.2").attr("result","b");
      const fm = f.append("feMerge");
      fm.append("feMergeNode").attr("in","b");
      fm.append("feMergeNode").attr("in","SourceGraphic");
    });
  }, []);

  const toXY = (lat:number, lon:number):[number,number]|null => {
    if (!projectionRef.current) return null;
    return projectionRef.current([lon,lat]) as [number,number];
  };

  /** Bezier między dwoma punktami z lekkim łukiem */
  function curvePath([x1,y1]:[number,number],[x2,y2]:[number,number]){
    const dx = x2 - x1, dy = y2 - y1;
    const mx = (x1 + x2)/2, my = (y1 + y2)/2;
    const k = 0.18; // krzywizna (subtelna)
    const nx = -dy, ny = dx;
    const c1 = [mx + nx*k, my + ny*k];
    const c2 = [mx + nx*k, my + ny*k];
    return `M ${x1} ${y1} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${x2} ${y2}`;
  }

  /** Łuk geodezyjny między dwoma punktami */
  function geodesicPath([x1,y1]:[number,number],[x2,y2]:[number,number],[lon1,lat1]:[number,number],[lon2,lat2]:[number,number]){
    const projection = projectionRef.current;
    if (!projection) return "";

    // geoInterpolate działa na współrzędnych [lon,lat]
    const interpolator = d3.geoInterpolate([lon1, lat1], [lon2, lat2]);
    const steps = 40; // im więcej, tym gładszy łuk
    const coords = d3.range(steps+1).map(i => projection(interpolator(i/steps)) as [number,number]);
    return d3.line()(coords) || "";
  }

  /** kąt między punktami [lon,lat] w radianach */
  function geoAngle(a:[number,number], b:[number,number]){
    return d3.geoDistance(a, b); // 0..π
  }

  /** auto-wybór trybu łuku: blisko = bezier, daleko = geodesic */
  function pickArcMode(a:[number,number], b:[number,number]){
    const angle = geoAngle(a,b);          // radiany
    const deg = angle * 180/Math.PI;      // º
    // progi: < 15º (ok. 1650 km) → bezier; inaczej geodesic
    return deg < 15 ? "bezier" : "geodesic";
  }

  useImperativeHandle(ref, (): MapAPI => ({
    focus:(lat,lon,scale=2.2)=>{
      if (!gRef.current) return;
      const xy = toXY(lat,lon); if (!xy) return;
      const W = svgRef.current!.clientWidth || window.innerWidth;
      const H = svgRef.current!.clientHeight || window.innerHeight;
      const [x,y] = xy;
      const tx = W/2 - x*scale, ty = H/2 - y*scale;
      d3.select(gRef.current).transition().duration(900).ease(d3.easeCubicInOut)
        .attr("transform", `translate(${tx},${ty}) scale(${scale})`);
    },

    marker:(lat,lon,label="",active=false)=>{
      if (!gRef.current) return "";
      const xy = toXY(lat,lon); if (!xy) return "";
      const [x,y] = xy;
      const id = `m-${++markerIdSeq.current}`;
      const markers = d3.select(gRef.current).select<SVGGElement>("g.markers");

      const g = markers.append("g")
        .attr("class", `marker ${active?"marker--active":"marker--inactive"}`)
        .attr("data-id", id);

      g.append("circle").attr("class","marker__dot").attr("cx",x).attr("cy",y).attr("r",4);

      let chipBBox:DOMRect|undefined;
      if (label){
        const paddingX = 6, paddingY = 4, offsetX = 10, offsetY = 10;
        const text = g.append("text")
          .attr("class","marker__chip-text")
          .attr("x", x + offsetX + paddingX)
          .attr("y", y - offsetY)
          .attr("dominant-baseline","hanging")
          .text(label);
        const bb = (text.node() as SVGTextElement).getBBox();
        chipBBox = bb as DOMRect;
        g.insert("rect","text")
          .attr("class","marker__chip-bg")
          .attr("x", bb.x - paddingX).attr("y", bb.y - paddingY)
          .attr("width", bb.width + paddingX*2).attr("height", bb.height + paddingY*2);

        // miejsce na mini waveform – przy prawym końcu etykiety
        const wf = g.append("g").attr("class","wf").attr("transform",
          `translate(${bb.x + bb.width + 8}, ${bb.y + bb.height/2})`);
        const gap = 3;
        for(let i=0;i<5;i++){
          wf.append("rect").attr("x", i*(2+gap)).attr("y", -12).attr("height", 12);
        }
      }

      markersMap.current.set(id, { id, x, y, chipBBox });
      return id;
    },

    setActiveMarker:(id:string|null)=>{
      if (!gRef.current) return;
      const sel = d3.select(gRef.current).select("g.markers").selectAll<SVGGElement,unknown>("g.marker");
      sel.classed("marker--active", false).classed("marker--inactive", true);
      if (id){
        sel.filter(function(){ return (this as SVGGElement).getAttribute("data-id") === id; })
           .classed("marker--inactive", false).classed("marker--active", true);
      }
    },

    showWaveform:(id:string, on:boolean)=>{
      if (!gRef.current) return;
      d3.select(gRef.current).select("g.markers")
        .selectAll<SVGGElement,unknown>("g.marker")
        .filter(function(){ return (this as SVGGElement).getAttribute("data-id") === id; })
        .select<SVGGElement>("g.wf")
        .classed("wf--on", !!on);
    },

    link:(fromId:string, toId:string, opts)=>{
      if (!gRef.current) return;
      const from = markersMap.current.get(fromId);
      const to = markersMap.current.get(toId);
      if (!from || !to) return;

      // znajdź oryginalne lon/lat markerów z rzutowania wstecznego
      const proj = projectionRef.current;
      if (!proj || !proj.invert) {
        // projection jeszcze się nie zainicjalizował albo nie ma invert
        return;
      }
      
      const lonlatFrom = proj.invert([from.x, from.y]) as [number,number];
      const lonlatTo = proj.invert([to.x, to.y]) as [number,number];

      let use = opts?.mode ?? (opts?.geodesic ? "geodesic" : "auto");
      if (use === "auto") use = pickArcMode(lonlatFrom, lonlatTo); // "bezier" | "geodesic"

      let d = "";
      if (use === "geodesic") {
        d = geodesicPath([from.x,from.y],[to.x,to.y],[lonlatFrom[0],lonlatFrom[1]],[lonlatTo[0],lonlatTo[1]]);
      } else {
        d = curvePath([from.x,from.y],[to.x,to.y]);
      }

      const links = d3.select(gRef.current).select<SVGGElement>("g.links");
      const p = links.append("path")
        .attr("class", "marker-link")
        .attr("d", d)
        .attr("opacity", 0);

      // fade (gradient) i dashed opcjonalnie
      if (opts?.fade !== false) p.classed("marker-link--fade", true);
      if (opts?.dashed) p.classed("marker-link--dash", true);

      p.transition().duration(300).attr("opacity", .9)
        .transition().duration(opts?.duration ?? 1400).attr("opacity", .4);
    },

    clearLinks:()=>{
      if (!gRef.current) return;
      d3.select(gRef.current).select("g.links").selectAll("*").remove();
    },

    highlight: (geo) => {
      if (!gRef.current || !projectionRef.current) return;
      const path = d3.geoPath(projectionRef.current);
      d3.select(gRef.current).select("g.changes").append("path")
        .attr("d", (path as any)(geo))
        .attr("fill","rgba(212,175,55,.06)")
        .attr("stroke","var(--accent)").attr("stroke-width",1.6)
        .attr("opacity",0).transition().duration(600).attr("opacity",1);
    },

    reset:(opts?:{hard?:boolean})=>{
      if (!gRef.current) return;
      d3.select(gRef.current).interrupt().attr("transform","translate(0,0) scale(1)");
      d3.select(gRef.current).select("g.links").selectAll("*").remove();
      d3.select(gRef.current).select("g.changes").selectAll("*").remove();
      if (opts?.hard){
        d3.select(gRef.current).select("g.markers").selectAll("*").remove();
        markersMap.current.clear();
        markerIdSeq.current = 0;
      }
    }
  }), []);

  // Listen for MAP_FOCUS events from mobile
  useEffect(() => {
    const handleMapFocus = (e: any) => {
      const { lat, lon, zoom = 3.6, duration = 900 } = e.detail || {};
      if (lat != null && lon != null) {
        // Use the focus API
        api.focus(lat, lon, zoom);
      }
    };
    
    window.addEventListener("MAP_FOCUS", handleMapFocus as EventListener);
    return () => window.removeEventListener("MAP_FOCUS", handleMapFocus as EventListener);
  }, []);

  return <svg ref={svgRef} className="absolute inset-0 w-full h-full" />;
});

export default AnimatedMapSVG;