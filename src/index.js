import { Component } from 'react'
import { Alert } from 'react-native'
import ValidatorHOC from './ValidatorHOC'
import rules from './rules'

// 添加默认容器组件
class _ValidatorContainer extends Component {
    render() {
        return <View {...this.props} />
    }
}

// 设置错误处理器
ValidatorHOC.errorHandle = errors => Alert.alert(errors[0].message)

// 增加默认规则
ValidatorHOC.addRules(rules)

export const ValidatorContainer = ValidatorHOC.wrapValidatorContainer(_ValidatorContainer)
export default ValidatorHOC