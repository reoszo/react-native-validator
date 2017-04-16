import { Component } from 'react'
import { Alert } from 'react-native'
import validatorHOC from './validatorHOC'
import rules from './rules'

// 添加默认容器组件
class _ValidatorContainer extends Component {
    render() {
        return <View {...this.props} />
    }
}

// 设置错误处理器
validatorHOC.errorHandle = errors => Alert.alert(errors[0].message)

// 增加默认规则
validatorHOC.addRules(rules)

export const ValidatorContainer = validatorHOC.wrapValidatorContainer(_ValidatorContainer)
export default validatorHOC