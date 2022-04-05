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
  debug('Subscribed to topics!')
})

client.on('message', async function (topic, message) {
  const data_time = new Date();
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
  
  const data_value = model_name == 'image' ? Buffer.from(message) : parseFloat(message);

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