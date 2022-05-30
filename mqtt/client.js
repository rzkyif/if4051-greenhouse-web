const mqtt = require('mqtt')
const { PrismaClient } = require('@prisma/client');

const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');
function debug(message) {
  if (VERBOSE) {
    console.log(message)
  }
}

debug('Connecting to MQTT broker...')
const client  = mqtt.connect(`tcp://broker.hivemq.com`)

debug('Connecting to database...')
const db = new PrismaClient();

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
    debug(`Received and stored ${data_type} data!`)
  } catch (err) {
    console.log(`Error: Failed to store ${data_type} data!\n${err}`);
  }
})