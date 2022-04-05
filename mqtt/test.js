const mqtt = require('mqtt')

const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');
function debug(message) {
  if (VERBOSE) {
    console.log(message)
  }
}

debug('Connecting to MQTT broker...')
const client  = mqtt.connect(`tcp://broker.hivemq.com`)

client.on('connect', function () {
  debug('MQTT client connected!')
})

function sendData() {
  client.publish("if4051-5-temperature", "27")
  client.publish("if4051-5-humidity-ground", "65535")
  client.publish("if4051-5-humidity-air", "74")
  client.publish("if4051-5-light", "23.4")
  client.publish("if4051-5-image", "98u2(@9827929&@(2987g@(g72989*@g9*@79G@8&@892&(*g2(*@&g9*@&G(*@G79*@")
  debug('Sent test data!')
}
setInterval(sendData, 5000)