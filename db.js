/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const io = require('./io')

class DataBase {
    constructor(id, isArray) {
        io.mkdirs('database/')
        this.path = 'database/' + id + '.json'

        this.file = io.open(this.path, 'rw').checkExistsOrWriteJson(isArray ? [] : {})
    }
    update(t) {
        this.file.writeAllJson(t)
    }
    read() {
        return this.file.readAllJson()
    }
}

module.exports = DataBase
