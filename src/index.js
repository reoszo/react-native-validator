import { Component } from 'react'
import { wrapContainer, wrapElement, checkRule, exec, and, or } from 'HOC'
import rules from './rules'

// 添加默认容器组件
class Container extends Component {
    render() {
        return <View {...this.props} />
    }
}
const ValidatorContainer = wrapContainer(Container)

export {
    ValidatorContainer,
    wrapContainer,
    wrapElement,
    checkRule,
    rules,
    exec,
    and,
    or
}

// 设置错误处理器
// ValidatorHOC.errorHandle = errors => Alert.alert(errors[0].message)