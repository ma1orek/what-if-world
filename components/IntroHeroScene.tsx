import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";

export default function IntroHeroScene(){
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    const W = ref.current!.clientWidth || window.innerWidth;
    const H = ref.current!.clientHeight || window.innerHeight;
    svg.attr("viewBox", `0 0 ${W} ${H}`).style("opacity", 0);

    Promise.all([
      fetch("/data/land-110m.json").then(r=>r.json()),
      fetch("/data/countries-110m.json").then(r=>r.json()),
    ]).then(([land110m, countries110m])=>{
      const landFC = feature(land110m, land110m.objects.land) as any;
      const bordersMesh = mesh(countries110m, countries110m.objects.countries, (a:any,b:any)=>a!==b);
      const projection = d3.geoNaturalEarth1().fitSize([W, H], landFC);
      const path = d3.geoPath(projection);

      // defs – roughen/pen vibe
      const defs = svg.append("defs");
      const turb = defs.append("feTurbulence").attr("type","fractalNoise").attr("baseFrequency","0.9").attr("numOctaves","1").attr("result","turb");
      const dispF = defs.append("filter").attr("id","rough");
      dispF.append("feDisplacementMap").attr("in","SourceGraphic").attr("in2","turb").attr("scale","0.6");
      const grad = defs.append("linearGradient").attr("id","ink").attr("x1","0").attr("x2","0").attr("y1","0").attr("y2","1");
      grad.append("stop").attr("offset","0%").attr("stop-color","#ffffff").attr("stop-opacity","0.9");
      grad.append("stop").attr("offset","100%").attr("stop-color","#aaaaaa").attr("stop-opacity","0.6");

      const g = svg.append("g").attr("filter","url(#rough)");

      // graticule (lekko)
      g.append("path")
        .attr("d", path(d3.geoGraticule10()) as any)
        .attr("fill","none").attr("stroke","#2b2b2f").attr("stroke-width",0.6).attr("opacity",0.25)
        .attr("vector-effect","non-scaling-stroke");

      // land outline – „rysowanie" dashoffset
      const land = g.append("path").datum(landFC as any).attr("d", path as any)
        .attr("fill","none").attr("stroke","url(#ink)").attr("stroke-width",1.8)
        .attr("stroke-linecap","round").attr("stroke-linejoin","round").attr("vector-effect","non-scaling-stroke");

      const len = (land.node() as SVGPathElement).getTotalLength();
      land.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len);

      // borders – cieńsze, wchodzą później
      const borders = g.append("path").datum(bordersMesh as any).attr("d", path as any)
        .attr("fill","none").attr("stroke","#666a73").attr("stroke-width",0.7).attr("opacity",0)
        .attr("vector-effect","non-scaling-stroke");

      // ładne miasta na intro
      const cities = [[48.8566,2.3522],[51.5074,-0.1278],[41.9028,12.4964],[40.7128,-74.0060],[35.6762,139.6503]];
      cities.forEach(([lat,lon])=>{
        const [x,y] = projection([lon,lat]);
        svg.append("circle").attr("cx",x).attr("cy",y).attr("r",2.8).attr("fill","var(--accent)").attr("opacity",.65);
      });

      svg.attr("opacity", .55); // delikatnie w tle
      svg.transition().duration(400).style("opacity",.55);
      land.transition().duration(1400).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0);
      borders.transition().delay(900).duration(600).attr("opacity",0.35);

      // delikatny parallax na mysz
      svg.on("mousemove", (e:any) => {
        const [x,y] = d3.pointer(e);
        const dx = (x - W/2)/W, dy = (y - H/2)/H;
        g.attr("transform", `translate(${dx*10}, ${dy*6})`);
      });
    });
  }, []);

  return (
    <div className="absolute inset-0 -z-10">
      <svg ref={ref} className="w-full h-full" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"/>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none"/>
    </div>
  );
}