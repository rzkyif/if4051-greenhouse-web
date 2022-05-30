const mqtt = require('mqtt')
const { PrismaClient } = require('@prisma/client')
const { Image } = require('image-js')

const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose')
function debug(message) {
  if (VERBOSE) {
    console.log(message)
  }
}

debug('Connecting to MQTT broker...')
const client  = mqtt.connect(`tcp://broker.hivemq.com`)

debug('Connecting to database...')
const db = new PrismaClient()

client.on('connect', function () {
  debug('MQTT client connected!')
  client.subscribe("if4051-5-temperature")
  client.subscribe("if4051-5-humidity-ground")
  client.subscribe("if4051-5-humidity-air")
  client.subscribe("if4051-5-light")
  client.subscribe("if4051-5-image")
  debug('Subscribed to topics!')
})

client.on('message', async function (topic, message) {
  const data_time = new Date()
  const data_type = topic.slice(9)

  let model_name
  switch (data_type) {
    case 'humidity-air':
      model_name = 'humidityAir'
      break
    case 'humidity-ground':
      model_name = 'humidityGround'
      break
    case 'light':
      model_name = 'light'
      break
    case 'image':
      model_name = 'image'
      break
    default:
      model_name = 'temperature'
      break
  }
  
  const data_value = model_name == 'image' ? Buffer.from(message) : parseFloat(message)

  try {
    await db[model_name].create({
      data: {
        time: data_time,
        value: data_value
      }
    })
    if (model_name == 'image') {
      const image = await Image.load(data_value)
      const height = calculate_first_green_row(image) / (image.height-1)

      await db.height.create({
        data: {
          time: data_time,
          value: height
        }
      })
    }
    debug(`Received and stored ${data_type} data!`)
  } catch (err) {
    console.log(`Error: Failed to store ${data_type} data!\n${err}`)
  }
})

function calculate_first_green_row(image) {
  const data = image.hsv().data
  const data_width = image.width * 4
  let go = true
  let i = 0
  while (go && i < data.length) {
    if ( (data[i] > 50 && data[i] < 96) && (data[i+1] > 100) && (data[i+2] > 76) ) go = false
    i += 4
  }
  return Math.floor(i / data_width)
}