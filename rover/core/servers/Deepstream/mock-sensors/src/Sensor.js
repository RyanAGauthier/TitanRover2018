var format = require('date-fns/format')
const { getRandomIntInclusive, getRandomFloatInclusive } = require('./util')
const { getClient } = require('./deepstream')
const chalk = require('chalk')
const log = console.log

class Sensor {
    constructor(name, path, props, timeDelay = 1000, debug = false, verbose = false) {
        this.name = name
        this.path = path
        this.props = Object.entries(props)
        this.timeDelay = timeDelay
        this.debug = debug
        this.verbose = verbose
        this._ds = null
        this._interval = null
        this.start = this.start.bind(this)
        this.stop = this.stop.bind(this)
        this.emit = this.emit.bind(this)
    }

    async start() {
        try {
            this._ds = await getClient()

            let startMessage = `Starting ${this.name} sensor... `

            if (this.debug) {
                const debuggingType = this.verbose ? 'verbose debugging' : 'normal debugging'
                startMessage += `with ${chalk.underline.green(debuggingType)} turned on.`
            }

            log(chalk.green(startMessage))

            this._interval = setInterval(() => {
                this.emit();
            }, this.timeDelay)
        }
        catch (e) {
            console.error(e)
            process.exit(1)
        }
    }

    stop() {
        clearInterval(this._interval)
    }

    emit() {
        let timestamp = Date.now()
        let payload = { timestamp }
        const timestampedPath = `${this.path}/${timestamp}`

        // load data into the payload
        this.props.forEach(([key, val]) => {
            let data = this._generateData(val)
            payload[key] = data

            if (this.debug) {
                log(chalk.yellow(`${format(timestamp, 'HH:mm:ss.SSS A')} - ${this.name} [${timestampedPath}] - Generated value for ${key}: ${data}`))
            }
        })

        this._ds.record.setData(timestampedPath, payload)

        if (this.debug && this.verbose) {
            log(chalk.cyan(JSON.stringify(payload, null, 4)))
        }

        log('---------------')
    }

    _generateData(d) {
        if (d.floatingPoint) {
            return getRandomFloatInclusive(d.min, d.max)
        }
        return getRandomIntInclusive(d.min, d.max)
    }
}

module.exports = Sensor