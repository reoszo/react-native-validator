import { Component } from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'

let eventCenter = 。。。？

// 现在的验证器只支持同步。。。？
// Container 包含多层的验证逻辑。。。？

export default v = {
    /**
     * 创建验证组件第一步：给容器组件增加验证方法，可以调用实例的 validate 方法验证所有子组件
     * @param {*} WrappedComponent 
     */
    wrapValidatorContainer(WrappedComponent) {
        class Container extends Component {
            static childContextTypes = {
                validatorId: React.PropTypes.any
            }

            constructor(...args) {
                super(...args)
                this.state = {
                    validatorId: Symbol()
                }
            }

            getChildContext() {
                return this.state
            }

            validate(cancelDefaultHandler) {
                return new Promise((resolve, reject) => {
                    let errors = []
                    eventCenter.trigger(this.state.validatorId, errors)
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
                return <WrappedComponent ref={innerRef} {...props} /> // children 能传过去。。。？
            }
        }

        hoistNonReactStatic(Container, WrappedComponent)

        return Container
    },

    /**
     * 创建验证组件第二步：给需要验证的组件增加验证器，可以在组件上使用 validator 属性响应容器的 validate 方法
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
                validatorId: React.PropTypes.any
            }

            constructor(props) {
                super(props)
                this.state = {
                    invalid: false
                }
            }

            componentDidMount() {
                if (this.context.validatorId && this.props.validator) {
                    eventCenter.on(this.context.validatorId, this.onValidate, this)
                }
            }

            componentWillReceiveProps(nextProps) {
                let hasValidator = this.context.validatorId && this.props.validator
                if (hasValidator && this.props.validator.on === 'change' && this.props[valueKey] !== nextProps[valueKey]) {
                    this.validate(nextProps, true)
                }
            }

            componentWillUnmount() {
                if (this.context.validatorId && this.props.validator) {
                    eventCenter.off(this.context.validatorId, this.onValidate, this)
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
                let { ...props } = this.props
                props[invalidKey] = this.state.invalid // 传递验证结果
                return <WrappedComponent {...props} /> // children 能传过去。。。？
            }
        }

        hoistNonReactStatic(Element, WrappedComponent)

        return Element
    },

    resultHandle(errors) {
        // 结果默认处理器
        // ToastAndroid.show(errors[0].message)
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
        return this.props.children // 子元素不能是多个
        // return <View>{this.props.children}</View> // 多了一个空View影响布局
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

// 添加默认规则，方便共享使用，不要添加业务的验证规则
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
    number: {
        rule: /^[-]?\d+(\.\d+)?$/,
        message: "{name}必须为数值类型"
    },
    numeric: {
        rule: /^[-]?\d+(\.\d+)?$/,
        message: "{name}必须为数值类型"
    },
    alpha: {
        rule: /^[a-zA-z\s]+$/,
        message: "{name}只能包含字母和空格"
    },
    alphanumeric: {
        rule: /^[a-zA-Z0-9]+$/,
        message: "{name}只允许输入字母和数字"
    },
    alpha_dash: {
        rule: /^([-a-z0-9_-])+$/,
        message: "{name}只能包含字母、数字、横线和下划线"
    },
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
        rule: v => v > n,
        message: `{name}必须大于${n}`
    }),
    gte: n => ({
        rule: v => v >= n,
        message: `{name}必须大于等于${n}`
    }),
    lt: n => ({
        rule: v => v < n,
        message: `{name}必须小于${n}`
    }),
    lte: n => ({
        rule: v => v <= n,
        message: `{name}必须小于等于${n}`
    })
})