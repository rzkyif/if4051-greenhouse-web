import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Chart from "chart.js/auto";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { db } from "~/db.server";

const DATA_PATTERN_MULTIPLE = { take: 5, orderBy: {time: 'desc'} }
const DATA_PATTERN_SINGLE = { take: 1, orderBy: {time: 'desc'} }

const IMAGE_HEIGHT = 480
const IMAGE_BOTTOM = 388
const PLANT_MAX_HEIGHT = 25

export async function loader() {
  const data = {
    temperature: (await db.temperature.findMany(DATA_PATTERN_MULTIPLE)).reverse(),
    humidityAir: (await db.humidityAir.findMany(DATA_PATTERN_MULTIPLE)).reverse(),
    light: (await db.light.findMany(DATA_PATTERN_MULTIPLE)).reverse(),
    humidityGround: await db.humidityGround.findMany(DATA_PATTERN_SINGLE),
    tds: await db.tds.findMany(DATA_PATTERN_SINGLE),
    height: await db.height.findMany(DATA_PATTERN_SINGLE)
  }
  return json(data);
}

export default function Index() {
  const data = useLoaderData()
  const chartCanvas = useRef()

  function formatTime(date) {
    return dayjs(date).format('DD/MM/YYYY HH:mm:ss')
  }

  function warnIfBad(x,maxD,maxW,minW,minD) {
    if (x < maxD || x > minD) {
      return "bg-red-200"
    } else if (x < maxW || x > minW) {
      return "bg-orange-200"
    } else {
      return "bg-stone-200"
    }
  }

  useEffect(() => {
    chartCanvas.current.width = chartCanvas.current.offsetWidth;
    chartCanvas.current.height = chartCanvas.current.offsetHeight;
    Chart.defaults.font.size = 16
    Chart.defaults.font.weight = 'bold'
    new Chart(chartCanvas.current, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Temperature',
            data: data.temperature.map((d)=>{return {x: formatTime(d.time), y: d.value}}),
            borderColor: 'rgba(255,0,0,1)'
          },
          {
            label: 'Air Humidity',
            data: data.humidityAir.map((d)=>{return {x: formatTime(d.time), y: d.value}}),
            borderColor: 'rgba(0,0,255,1)'
          },
          {
            label: 'Light',
            data: data.light.map((d)=>{return {x: formatTime(d.time), y: d.value}}),
            borderColor: 'rgba(255,255,0,1)'
          }
        ]
      }
    })
  }, [])

  return (
    <div className="bg-stone-100 min-h-screen w-screen flex justify-center">
      <div className="flex flex-col p-4 px-8 justify-center items-center lg:mx-64">
        <h1 className="text-5xl font-bold mb-2">Smart Greenhouse</h1>
        <h2 className="text-3xl font-semibold mb-16">Status</h2>
        <div className="flex flex-row flex-wrap mb-2">
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.temperature.at(-1).value,10,20,30,40)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Temperature
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.temperature.at(-1).value}&deg;C
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.humidityAir.at(-1).value,40,74,80,90)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Air Humidity
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.humidityAir.at(-1).value}%
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.humidityGround.at(0).value,0,0,40000,40000)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Water Level
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.humidityGround.at(0).value > 40000 ? 'Low' : 'High'}
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.light.at(-1).value,5,20,30,80)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Light
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {(Math.round(data.light.at(-1).value))}lx
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.tds.at(0).value,300,400,900,1000)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              TDS
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {(Math.round(data.tds.at(0).value))}ppm
            </span>
          </div>
          <div className="flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none bg-stone-200">
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Height
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {(data.height.at(0).value * IMAGE_HEIGHT) > IMAGE_BOTTOM ? "0" : Math.round(((IMAGE_BOTTOM - (data.height.at(0).value * IMAGE_HEIGHT)) / IMAGE_BOTTOM) * PLANT_MAX_HEIGHT)}cm
            </span>
          </div>
          <div className="relative flex rounded-2xl bg-stone-200 basis-full min-h-[50vh] p-4 mr-2 mb-2">
            <canvas className="w-full h-full" ref={chartCanvas}/>
          </div>
        </div>
      </div>
    </div>
  );
}
