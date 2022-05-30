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
  client.subscribe("if4051-5-tds")
  debug('Subscribed to topics!')
})

client.on('message', async function (topic, message) {
  let data_time = new Date()
  let data_parts = message.toString().split('|')
  let data_value = 0
  const data_type = topic.slice(9)

  let model_name
  switch (data_type) {
    case 'humidity-air':
      model_name = 'humidityAir'
      data_time = new Date(parseInt(data_parts[0]), parseInt(data_parts[1]), parseInt(data_parts[2]), parseInt(data_parts[3]), parseInt(data_parts[4]), parseInt(data_parts[5]))
      data_value = parseInt(data_parts[6])
      break
    case 'humidity-ground':
      model_name = 'humidityGround'
      data_time = new Date(parseInt(data_parts[0]), parseInt(data_parts[1]), parseInt(data_parts[2]), parseInt(data_parts[3]), parseInt(data_parts[4]), parseInt(data_parts[5]))
      data_value = parseInt(data_parts[6])
      break
    case 'light':
      model_name = 'light'
      data_time = new Date(parseInt(data_parts[0]), parseInt(data_parts[1]), parseInt(data_parts[2]), parseInt(data_parts[3]), parseInt(data_parts[4]), parseInt(data_parts[5]))
      data_value = parseFloat(data_parts[6])
      break
    case 'tds':
      model_name = 'tds'
      data_time = new Date(parseInt(data_parts[0]), parseInt(data_parts[1]), parseInt(data_parts[2]), parseInt(data_parts[3]), parseInt(data_parts[4]), parseInt(data_parts[5]))
      data_value = parseFloat(data_parts[6])
      break
    case 'image':
      model_name = 'image'
      data_value = Buffer.from(message)
      break
    default:
      model_name = 'temperature'
      data_time = new Date(parseInt(data_parts[0]), parseInt(data_parts[1]), parseInt(data_parts[2]), parseInt(data_parts[3]), parseInt(data_parts[4]), parseInt(data_parts[5]))
      data_value = parseInt(data_parts[6])
      break
  }

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
      debug(`Stored height data!`)
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