import { Component } from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import EventCenter from './EventCenter'

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

export default ValidatorHOC = {
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
                    validatorHOC._eventCenter.emit(this.state.validatorSymbol, errors)
                    if (errors.length) {
                        if (cancelDefaultHandler) {
                            reject(errors)
                        } else {
                            validatorHOC.errorHandle(errors)
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
                    validatorHOC._eventCenter.on(this.context.validatorSymbol, this.onValidate, this)
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
                    validatorHOC._eventCenter.off(this.context.validatorSymbol, this.onValidate, this)
                }
            }

            validate(props, errorToast) { // 验证逻辑，返回验证失败的 message 数组
                let errors = [],
                    invalid = false,
                    { validator } = props,
                    { validate, ...param } = validator
                if (!props[skipKey]) {
                    if (typeof validate !== 'function') {
                        validate = Array.isArray(validate) ? validatorHOC.and.apply(v, validate) : validatorHOC.or.call(v, validate) // 只有一项，和 validatorHOC.and.call(v, validate) 等价
                    }
                    param.name = param.name || props[nameKey] || ''
                    param.value = param.value || props[valueKey] || ''
                    messages = validate(param.value, param)
                    invalid = messages.length > 0
                    if (errorToast && invalid) {
                        validatorHOC.errorHandle(messages.map(message => ({
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

    // 默认错误处理器
    errorHandle(errors) {
        // ...
    },

    // 规则 && 操作
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

    // 规则 || 操作
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
