import { useState } from 'react';
import Head from 'next/head';
import AnimatedMapSVG from '../components/AnimatedMapSVG';

const testScenario = {
  summary: "Napoleon wins at Waterloo, reshaping European history",
  timeline: [
    {
      year: 1815,
      title: "Victory at Waterloo",
      description: "Napoleon's tactical brilliance secures victory",
      geoPoints: [[50.6794, 4.4125]] as [number, number][]
    },
    {
      year: 1820,
      title: "Continental Dominance",
      description: "French empire expands across Europe",
      geoPoints: [[48.8566, 2.3522]] as [number, number][]
    }
  ],
  geoChanges: []
};

export default function TestSVG() {
  const [scenario] = useState(testScenario);

  return (
    <>
      <Head>
        <title>Test SVG Map</title>
      </Head>
      <main className="w-full h-screen bg-slate-900">
        <AnimatedMapSVG scenario={scenario} />
      </main>
    </>
  );
}