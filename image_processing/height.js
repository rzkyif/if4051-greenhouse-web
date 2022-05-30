const fg = require('fast-glob');
const { Image } = require('image-js');

fg('./image_processing/test-image-*.jpg').then((entries) => {
  entries.forEach(async (filename) => {
    const image = await Image.load(filename);
    const start = Date.now();
    const green_row = calculate_first_green_row(image);
    const time = Date.now() - start;
    console.log(`[${filename}] {${time}ms} Row ${green_row}/${image.height-1}. Plant is ${Math.round(100 - (100*green_row/(image.height-1)))}% of image height.`);
  })
}, (error) => {
  console.log(`ERROR!\n${error}`);
})

function calculate_first_green_row(image) {
  const data = image.hsv().data;
  const data_width = image.width * 4;
  let go = true;
  let i = 0;
  while (go && i < data.length) {
    if ( (data[i] > 50 && data[i] < 96) && (data[i+1] > 100) && (data[i+2] > 76) ) go = false;
    i += 4;
  }
  return Math.floor(i / data_width);
}