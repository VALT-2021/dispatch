async function randomText(array, range) {
    return array[Math.floor(Math.random() * range)]
}

module.exports = randomText