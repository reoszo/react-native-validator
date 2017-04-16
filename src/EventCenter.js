export default class EventCenter {
    constructor() {
        this._events = {}
    }
    on(name, listener, context) {
        let events = this._events[name] || (this._events[name] = [])
        events.push({
            listener,
            context
        })
    }
    off(name, listener) {
        if (listener && this._events[name]) {
            let events = this.events[name].filters(event => event.listener != listener)
            if (events.length > 0) {
                this._events[name] = events
            } else {
                delete this._events[name]
            }
        } else {
            delete this._events[name]

        }
    }
    emit(name, ...args) {
        let events = this._events[name] || []
        for (let i = 0, l = events.length; i < l; i++) {
            let event = events[i]
            event.listener.apply(event.context, args)
        }
    }
}