import { Component } from 'react'
import { wrapContainer, wrapElement, setHandler, checkRule, exec, and, or } from './HOC'
import rules from './rules'

// 添加默认容器组件
class Container extends Component {
    render() {
        return <View {...this.props} />
    }
}
const ValidatorContainer = wrapContainer(Container)

export default {
    ValidatorContainer,
    wrapContainer,
    wrapElement,
    setHandler,
    checkRule,
    rules,
    exec,
    and,
    or
}