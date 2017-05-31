import { Component } from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import EventCenter from './EventCenter'
import util from './util'

// {
//     message: "hello {name} \n hello '{'name'}'",
//     param: {
//         name: 'world'
//     }
// }
function format(message, param) {
    let reg = /('{')|('}')|({(\w+)})/g
    return (param.message || message).toString().replace(reg, (src, $1, $2, $3, $4) => {
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

const eventCenter = new EventCenter()

let errorHandler = function (errors) {
    // 默认错误处理
}

export function setHandler(handler) {
    if (typeof handler === 'function') {
        errorHandler = handler
    }
}

/**
 * 第一步：给容器组件增加 validate 验证方法
 * @param {*} wrapContainer 
 */
export function wrapContainer(WrappedComponent) {
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
                eventCenter.emit(this.state.validatorSymbol, errors)
                if (errors.length) {
                    if (cancelDefaultHandler) {
                        reject(errors)
                    } else {
                        errorHandler(errors)
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
}

/**
 * 第二步：给需要验证的组件增加验证器，可以在组件上使用 validator 属性响应容器的 validate 方法
 * @param {*} WrappedComponent 
 * @param {*} propKeyMap
 *      nameKey: 从 WrappedComponent 组件获取，传递给验证器的 name 属性名
 *      valueKey: 从 WrappedComponent 组件获取，传递给验证器的 value 属性名）
 *      skipKey: 从 WrappedComponent 组件获取，当 skipKey 属性为 true 时跳过验证
 *      invalidKey: 给 WrappedComponent 组件添加，验证失败的属性名
 *      messageKey: 给 WrappedComponent 组件添加，验证失败提示信息的属性名
 */
export function wrapElement(WrappedComponent, { nameKey = 'label', valueKey = 'value', skipKey = 'disabled', invalidKey = 'invalid', messageKey = 'message' }) {
    class Element extends Component {
        static contextTypes = {
            validatorSymbol: React.PropTypes.any
        }

        constructor(props) {
            super(props)
            this.state = {
                invalid: false,
                message: ''
            }
        }

        componentDidMount() {
            if (this.context.validatorSymbol && this.props.validator) {
                eventCenter.on(this.context.validatorSymbol, this.onValidate, this)
            }
        }

        componentWillReceiveProps(nextProps) {
            let hasValidator = this.context.validatorSymbol && this.props.validator
            if (hasValidator && this.props.validator.on === 'change' && this.props[valueKey] !== nextProps[valueKey]) {
                this.validate(nextProps)
            }
        }

        componentWillUnmount() {
            if (this.context.validatorSymbol && this.props.validator) {
                eventCenter.off(this.context.validatorSymbol, this.onValidate)
            }
        }

        validate(props) { // 验证逻辑，返回验证失败的 message
            let message,
                { validator } = props,
                { validate, ...param } = validator
            if (!props[skipKey]) {
                if (typeof validate !== 'function') {
                    validate = Array.isArray(validate) ? and.apply(global, validate) : or.call(global, validate) // 只有一项，和 and.call(v, validate) 等价
                }
                param.name = param.name || props[nameKey] || ''
                param.value = param.value || props[valueKey] || ''
                message = validate(param.value, param)
                this.setState({
                    invalid: !!message,
                    message
                })
            }
            return message
        }

        onValidate(errors) { // 响应验证
            let message = this.validate(this.props)
            if (message) {
                errors.push({
                    element: this,
                    message: message
                })
            }
        }

        render() {
            let { innerRef, ...props } = this.props
            props[invalidKey] = this.state.invalid // 传递验证结果
            props[messageKey] = this.state.message // 传递错误提示
            return <WrappedComponent ref={innerRef} {...props} />
        }
    }

    hoistNonReactStatic(Element, WrappedComponent)

    return Element
}

// 执行验证
export function exec(rule, value, param) { // 执行 rule，验证失败返回错误 message
    if (rule.rule) {
        let context = {
            message: rule.message || ''
        }
        if (rule.rule instanceof RegExp) {
            if (!rule.rule.test(value)) {
                return format(context.message, param)
            }
        } else if (typeof rule.rule === 'function') {
            if (!rule.rule.call(context, value, param)) {
                return format(context.message, param)
            }
        }
    }
}

// 规则 && 操作
export function and(...rules) {
    return (value, param) => {
        for (let rule of rules) {
            let message = typeof rule === 'function' ? rule(value, param) : exec(rule, value, param)
            if (message) {
                return message
            }
        }
    }
}

// 规则 || 操作
export function or(...rules) {
    return (value, param) => {
        let messages = []
        for (let rule of rules) {
            let message = typeof rule === 'function' ? rule(value, param) : exec(rule, value, param)
            if (!message) {
                return
            }
            messages.push(message)
        }
        return messages.pop()
    }
}

// // 验证处理规则
// export function wrapRule(rules) {
//     for (let [key, rule] of Object.entries(rules)) {
//         if (this[key]) {
//             throw new Error(`规则[${key}]已被使用`)
//         }
//         if (typeof rule !== 'function') {
//             if (!rule || typeof rule.rule !== 'function' && !(rule.rule instanceof RegExp)) {
//                 throw new TypeError(`规则[${key}]不是函数，也不是包含 rule(funciton or RegExp)的对象`)
//             }
//             if (rule.rule instanceof RegExp) { // 保证所有的内置规则都是函数
//                 let reg = rule.rule
//                 rule.rule = v => reg.test(v)
//             }
//         }
//     }
// }
