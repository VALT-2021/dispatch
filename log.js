const colors = require('colours')

async function log(content, type) {
    if (!content) return console.log('No content was given to log!'.red)
    if (type == 1) return console.log(content.green)
    if (type == 2) return console.log(content.yellow)
    if (type == 3) return console.log(content.red)
    else return console.log(content)
}

module.exports = log