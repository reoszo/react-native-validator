import { Component } from 'react'
import { Alert } from 'react-native'
import hoistNonReactStatic from 'hoist-non-react-statics'

class EventCenter {
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

export default v = {
    _eventCenter: new EventCenter(),
    /**
     * 第一步：给容器组件增加验证方法，可以调用实例的 validate 方法验证所有子组件
     * @param {*} WrappedComponent 
     */
    wrapValidatorContainer(WrappedComponent) {
        class Container extends Component {
            static childContextTypes = {
                validatorSymbol: React.PropTypes.any
            }

            constructor(...args) {
                super(...args)
                this.state = {
                    validatorSymbol: Symbol()
                }
            }

            getChildContext() {
                return this.state
            }

            validate(cancelDefaultHandler) {
                return new Promise((resolve, reject) => {
                    let errors = []
                    v._eventCenter.emit(this.state.validatorSymbol, errors)
                    if (errors.length) {
                        if (cancelDefaultHandler) {
                            reject(errors)
                        } else {
                            v.resultHandle(errors)
                        }
                    } else {
                        resolve()
                    }
                })
            }

            render() {
                let { innerRef, ...props } = this.props
                return <WrappedComponent ref={innerRef} {...props} />
            }
        }

        hoistNonReactStatic(Container, WrappedComponent)

        return Container
    },

    /**
     * 第二步：给需要验证的组件增加验证器，可以在组件上使用 validator 属性响应容器的 validate 方法
     * @param {*} WrappedComponent 
     * @param {*} propKeyMap
     *      nameKey: 从 WrappedComponent 组件获取，传递给验证器的 name 属性名
     *      valueKey: 从 WrappedComponent 组件获取，传递给验证器的 value 属性名）
     *      skipKey: 从 WrappedComponent 组件获取，当 skipKey 属性为 true 时跳过验证
     *      invalidKey: 给 WrappedComponent 组件添加验证结果标志，验证失败的属性名
     */
    wrapValidatorElement(WrappedComponent, { nameKey = 'label', valueKey = 'value', skipKey = 'disabled', invalidKey = 'invalid' }) {
        class Element extends Component {
            static contextTypes = {
                validatorSymbol: React.PropTypes.any
            }

            constructor(props) {
                super(props)
                this.state = {
                    invalid: false
                }
            }

            componentDidMount() {
                if (this.context.validatorSymbol && this.props.validator) {
                    v._eventCenter.on(this.context.validatorSymbol, this.onValidate, this)
                }
            }

            componentWillReceiveProps(nextProps) {
                let hasValidator = this.context.validatorSymbol && this.props.validator
                if (hasValidator && this.props.validator.on === 'change' && this.props[valueKey] !== nextProps[valueKey]) {
                    this.validate(nextProps, true)
                }
            }

            componentWillUnmount() {
                if (this.context.validatorSymbol && this.props.validator) {
                    v._eventCenter.off(this.context.validatorSymbol, this.onValidate, this)
                }
            }

            validate(props, errorToast) { // 验证逻辑，返回验证失败的 message 数组
                let errors = [],
                    invalid = false,
                    { validator } = props,
                    { validate, ...param } = validator
                if (!props[skipKey]) {
                    if (typeof validate !== 'function') {
                        validate = Array.isArray(validate) ? v.and.apply(v, validate) : v.or.call(v, validate) // 只有一项，和 v.and.call(v, validate) 等价
                    }
                    param.name = param.name || props[nameKey] || ''
                    param.value = param.value || props[valueKey] || ''
                    messages = validate(param.value, param)
                    invalid = messages.length > 0
                    if (errorToast && invalid) {
                        v.resultHandle(messages.map(message => ({
                            element: this,
                            message: message
                        })))
                    }
                    this.setState({ invalid })
                }
                return messages
            }

            onValidate(errors) { // 响应验证
                let messages = this.validate(this.props)
                for (let message of messages) {
                    errors.push({
                        element: this,
                        message: message
                    })
                }
            }

            render() {
                let { innerRef, ...props } = this.props
                props[invalidKey] = this.state.invalid // 传递验证结果
                return <WrappedComponent ref={innerRef} {...props} />
            }
        }

        hoistNonReactStatic(Element, WrappedComponent)

        return Element
    },

    // 结果默认处理器
    resultHandle(errors) {
        Alert.alert(errors[0].message)
    },

    // 组合规则，and or
    combineRule(rules) {
        Object.keys(rules).forEach(key => {
            let rule = rules[key]
            if (this[key]) {
                throw new Error(`规则[${key}]已被使用`)
            }
            if (typeof rule !== 'function') {
                throw new TypeError(`组合规则[${key}]不是函数`)
            }
            this[key] = rule
        })
    },

    // 添加规则
    addRules(rules) {
        for (let [key, rule] of Object.entries(rules)) {
            if (this[key]) {
                throw new Error(`规则[${key}]已被使用`)
            }
            if (typeof rule !== 'function') {
                if (!rule || typeof rule.rule !== 'function' && !(rule.rule instanceof RegExp) || typeof rule.message !== 'string') {
                    throw new TypeError(`规则[${key}]不是函数，也不是包含 rule(funciton or RegExp) 和 message(string) 的对象`)
                }
                if (rule.rule instanceof RegExp) { // 保证所有的规则都是函数
                    let reg = rule.rule
                    rule.rule = v => reg.test(v)
                }
            }
            this[key] = rule
        }
    }

}

class _ValidatorContainer extends Component {
    render() {
        return <View {...this.props} />
    }
}

export const ValidatorContainer = v.wrapValidatorContainer(_ValidatorContainer)

// {
//     message: "hello {name} \n hello '{'name'}'",
//     param: {
//         name: 'world'
//     }
// }
function formatMessage(message, param) {
    let reg = /('{')|('}')|({(\w+)})/g
    return (param.message || message).replace(reg, (src, $1, $2, $3, $4) => {
        if ($1) {
            return '{'
        }
        if ($2) {
            return '}'
        }
        if ($4) {
            return param[$4] || ''
        }
    })
}

// 添加默认 组合规则
v.combineRule({
    and(...rules) { // 返回错误元素和message的数组，没有错误返回空数组
        return (value, param) => {
            let errors = []
            for (let rule of rules) {
                if (typeof rule === 'function') { // combineRule 递归
                    let errs = rule(value, param)
                    errors.splice(errors.length, 0, ...errs)
                } else if (!rule.rule(value, param)) {
                    errors.push(formatMessage(rule.message, param))
                }
            }
            return errors
        }
    },
    or(...rules) {
        return (value, param) => {
            let errors = []
            for (let rule of rules) {
                if (typeof rule === 'function') { // combineRule 递归
                    let errs = rule(value, param)
                    if (errs.length === 0) {
                        return []
                    }
                    errors.splice(errors.length, 0, ...errs)
                } else if (!rule.rule(value)) {
                    errors.push(formatMessage(rule.message, param))
                } else {
                    return []
                }
            }
            return errors
        }
    }
})

function str(v) { // 转换 string
    return (str === null || str === undefined) ? '' : String(v)
}

v.addRules({
    required: { // 函数验证规则
        rule: v => /[\S]+/.test(str(v)),
        message: "{name}不能为空" // 使用大括号传递 message 参数
    },
    selected: {
        rule: v => /[\S]+/.test(str(v)),
        message: "请选择{name}"
    },
    digit: { // 正则验证规则
        rule: /^\d+$/,
        message: '{name}只允许输入数字'
    },
    number: { // 增加正数、负数、整数、小数等快捷规则。。。？
        rule: /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/,
        message: "{name}必须为数值类型"
    },
    alpha: {
        rule: /^[a-zA-z\s]+$/,
        message: "{name}只能包含字母"
    },
    alphaspace: {
        rule: /^[a-zA-z\s]+$/,
        message: "{name}只能包含字母和空格"
    },
    alphanumeric: {
        rule: /^[a-zA-Z0-9]+$/,
        message: "{name}只允许输入字母和数字"
    },
    alphanumeric_: {
        rule: /^([a-zA-Z0-9_])+$/,
        message: "{name}只能包含字母、数字和下划线"
    },
    alphanumericdash: {
        rule: /^([a-zA-Z0-9-])+$/,
        message: "{name}只能包含字母、数字和横线"
    },
    alphanumeric_dash: {
        rule: /^([a-zA-Z0-9-_])+$/,
        message: "{name}只能包含字母、数字、横线和下划线"
    },
    eq: n => ({
        rule: v => v == n,
        message: `{name}必须为${n}`
    }),
    eqeqeq: n => ({
        rule: v => v === n,
        message: `{name}必须为${n}`
    }),
    neq: n => ({
        rule: v => v != n,
        message: `{name}不能为${n}`
    }),
    neqeqeq: n => ({
        rule: v => v !== n,
        message: `{name}不能为${n}`
    }),
    gt: n => ({
        rule: v => Number(v) > n,
        message: `{name}必须大于${n}`
    }),
    gte: n => ({
        rule: v => Number(v) >= n,
        message: `{name}必须大于等于${n}`
    }),
    lt: n => ({
        rule: v => Number(v) < n,
        message: `{name}必须小于${n}`
    }),
    lte: n => ({
        rule: v => Number(v) <= n,
        message: `{name}必须小于等于${n}`
    }),
    min: n => ({ // 使用函数闭包传递参数
        rule: v => Number(v) >= Number(n),
        message: `{name}应该不小于${n}`
    }),
    max: n => ({
        rule: v => Number(v) <= Number(n),
        message: `{name}应该不超过${n}`
    }),
    range: (min, max) => ({
        rule: v => Number(v) > Number(min) && Number(v) < Number(max),
        message: `{name}必须在${min}和${max}之间`
    }),
    size: n => ({
        rule: v => str(v).length === Number(n),
        message: `{name}长度必须为${n}个字符`
    }),
    length: n => ({
        rule: v => str(v).length === Number(n),
        message: `{name}长度必须为${n}个字符`
    }),
    minlength: n => ({
        rule: v => str(v).length >= Number(n),
        message: `{name}应该不少于${n}个字符`
    }),
    maxlength: n => ({
        rule: v => str(v).length <= Number(n),
        message: `{name}应该不超过${n}个字符`
    }),
    rangelength: (min, max) => ({
        rule: v => str(v).length >= Number(min) && str(v).length <= Number(max),
        message: `{name}长度必须在${min}和${max}之间`
    }),
    email: {// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
        rule: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        message: "{value}不是有效的电子邮件地址"
    },
    url: { // https://gist.github.com/dperini/729294 see also https://mathiasbynens.be/demo/url-regex
        rule: /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i,
        message: "{value}不是有效的网址"
    },
    date: {
        rule: v => !/Invalid|NaN/.test(new Date(v).toString()),
        message: '{value}不是有效的日期'
    },
    dateISO: {
        rule: /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/,
        message: '{value}不是有效的日期 (YYYY-MM-DD)'
    },
    creditcard: { // http://en.wikipedia.org/wiki/Luhn_algorithm
        rule: function (value) {
            // accept only spaces, digits and dashes
            if (/[^0-9 \-]+/.test(value)) {
                return false;
            }
            let nCheck = 0,
                nDigit = 0,
                bEven = false,
                n, cDigit;
            value = value.replace(/\D/g, "");
            // Basing min and max length on
            // http://developer.ean.com/general_info/Valid_Credit_Card_Types
            if (value.length < 13 || value.length > 19) {
                return false;
            }
            for (n = value.length - 1; n >= 0; n--) {
                cDigit = value.charAt(n);
                nDigit = parseInt(cDigit, 10);
                if (bEven) {
                    if ((nDigit *= 2) > 9) {
                        nDigit -= 9;
                    }
                }
                nCheck += nDigit;
                bEven = !bEven;
            }
            return (nCheck % 10) === 0;
        },
        message: "{value}不是有效的信用卡格式"
    }
})