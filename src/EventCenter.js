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
    off(name, listener, context) {
        if (this._events[name] && (listener || context)) {
            let events = this._events[name].filter(event => !(listener && listener === event.listener || context && context === event.context))
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
        events.forEach(event => event.listener.apply(event.context, args))
    }
}