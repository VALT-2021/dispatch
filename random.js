async function random(highest, lowest) {
    return Math.floor(Math.random() * (highest - lowest) ) + lowest
}

module.exports = random