import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Chart from "chart.js/auto";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { db } from "~/db.server";

const DATA_PATTERN = { take: 10, orderBy: {time: 'desc'} }

export async function loader() {
  const data = {
    temperature: await db.temperature.findMany(DATA_PATTERN),
    humidityAir: await db.humidityAir.findMany(DATA_PATTERN),
    humidityGround: await db.humidityGround.findMany(DATA_PATTERN),
    light: await db.light.findMany(DATA_PATTERN)
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
      return "bg-red-300"
    } else if (x < maxW || x > minW) {
      return "bg-orange-300"
    } else {
      return "bg-stone-300"
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
    <div className="bg-stone-200 min-h-screen w-screen flex justify-center">
      <div className="flex flex-col p-4 px-8 justify-center items-center">
        <h1 className="text-5xl font-bold mb-2">Smart Greenhouse</h1>
        <h2 className="text-3xl font-semibold mb-16">Status</h2>
        <div className="flex flex-row flex-wrap mb-2">
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.temperature[0].value,10,20,30,40)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Temperature
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.temperature[0].value}&deg;C
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.humidityAir[0].value,40,74,80,90)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Air Humidity
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.humidityAir[0].value}%
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.humidityGround[0].value,40000,40000,65535,65535)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Water Level
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.humidityGround[0].value > 40000 ? 'Low' : 'High'}
            </span>
          </div>
          <div className={`
            flex flex-col flex-1 rounded-2xl mr-2 mb-2 select-none
            ${warnIfBad(data.light[0].value,5,20,30,80)}
          `}>
            <label className="rounded-t-2xl px-4 pt-4 pb-1 text-center font-semibold">
              Light
            </label>
            <span className="rounded-b-2xl px-4 pb-4 pt-1 text-center font-bold text-5xl">
              {data.light[0].value}lx
            </span>
          </div>
          <div className="relative flex rounded-2xl bg-stone-300 basis-full h-[50vh] p-4 mr-2 mb-2">
            <canvas className="w-full h-full" ref={chartCanvas}/>
          </div>
        </div>
      </div>
    </div>
  );
}