# react-native-validator

## 组件增加验证功能
1. 给容器组件添加验证方法，可以调用组件实例的 validate 方法验证内部的表单组件（或者使用自带的 ValidatorContainer 容器组件包裹所有表单）
```
    假设你已经有一个 Form 组件，它是表单的容器组件
    原 Form 组件代码
        import {Component} from 'react'
        ....
        export default class Form extends Component {
            ...
        }
        ...
    
    改为
        import {Component} from 'react'
        import v from 'react-native-validator' // 改动1、增加引用
            ....
            class Form extends Component { // 改动2、去除原 export default
                ...
            }
            ...
            export default v.wrapValidatorContainer(Form) // 改动3、改为 export defaut 包装结果
```

2. 给表单组件增加验证规则，可以在组件上配置 validator 规则描述
```
    假设你已经有一个 Input 组件
    Input 使用方式为
        <Input
            label="用户名"
            value=""
            placeholder="请输入用户名（邮箱或手机号）"
            disabled={false} />
    原 Input 组件代码
        import {Component} from 'react'
        ....
        export default class Input extends Component {
            ...
            render(){
                let {label, value, placeholder, disabled} = this.props
                return (
                    <View style={{
                        borderBottomWidth: 1,
                        borderBottomColor: '#888'
                    }}>
                        <Text>{label}</Text>
                        <TextInput value={value} placeholder={placeholder} disabled={disabled} />
                    </View>
                )
            }
        }
        ...
    
    改为
        import {Component} from 'react'
        import v from 'react-native-validator' // 改动1、增加引用
        ....
        class Input extends Component { // 改动2、去除原 export default
            ...
            render(){
                let {label, value, placeholder, disabled} = this.props
                return (
                    <View style={{
                        borderBottomWidth: 1,
                        borderBottomColor: this.props.invalid ? 'red' : '#888' // 改动3、增加验证失败的样式修改，invalid 属性是验证器失败后注入的，可以使用 invalidKey 修改名称，见改动4
                    }}>
                        <Text>{label}</Text>
                        <TextInput value={value} placeholder={placeholder} disabled={disabled} />
                    </View>
                )
            }
        }
        ...
        export default v.wrapValidatorElement(Input, { // 改动4、改为 export defaut 包装结果
            nameKey: 'label', // 从 Input 组件获取，传递给验证器的 name 属性名
            valueKey: 'value', // 从 Input 组件获取，传递给验证器的 value 属性名）
            skipKey: 'disabled', // 从 Input 组件获取，当 skipKey 属性为 true 时跳过验证
            invalidKey: 'invalid' // 给 Input 组件添加验证结果标志，验证失败的属性名
        })
```

3. 给验证器增加默认错误处理函数
```
    v.errorHandle = errors => {
        ToastAndroid(errors[0].message)
    }
```

## 使用验证组件

1. 拿到 form 实例
```
     <Form ref={instance => this.form = instance}> xxx </Form>
```

2. 编写验证规则，或者直接使用 v 中默认的规则集
```
     let required = {
         rule: value => !!value, // 可以直接使用默认验证器 value => v.and(v.required)(value)
         message: '用户名不能为空'
     }
     使用编写好的验证规则 required
         <Input label="用户名" validator={{validate: required}} /> // 用户名不能为空
    
    v.required: {
        rule: value => /[\S]+/.test(value),
        message: "{name}不能为空"
    }
     使用默认验证规则，传递 message 参数，默认传递 { name: label } 参数
         <Input label="用户名" validator={{validate: v.required}} /> // 不能为空
         <Input label="用户名" validator={{validate: v.required, name: '密码'}} /> // 密码不能为空
     使用默认验证规则，覆盖提示信息
         <Input label="用户名" validator={{validate: v.required, message: '用户名必须填写'}} />

     使用带参数的验证规则
         默认使用函数传递验证参数
             v.gt: n => ({
                 rule: v => v > n,
                 message: `{name}必须大于${n}`
             })
             <Input label="金额" validator={{validate: v.gt(0), name: '金额'}} /> // 金额必须大于0
         使用属性传递验证参数（不推荐，为了兼容旧代码）
             let mygt = {
                 rule: (val, param) => val > param.min
                 message: '{name}必须大于{min}'
             }
             <Input label="金额" validator={{validate: mygt, name: '金额', min: 0}} /> // 金额必须大于0

     使用组合多个验证规则 and or 组合规则，添加自定义组合规则详见方法 combineRule
     现在还不支持数组嵌套组合 v.and(v.required, [v.gt(0), v.lt(10)]) 需要修改为 v.and(v.required, v.and(v.gt(0), v.lt(10)))
         <Input validator={{validate: [v.required, v.gt(0)]}} /> 必填 且 大于0
         <Input validator={{validate: v.and(v.required, v.range(0, 1)]}} />  必填 且 在0到1之间 // 和数组等价
         <Input validator={{validate: v.or(v.lt(1), v.gt(10))}} /> 小于1 或 大于10
```

3. 调用 form 的验证方法
```
     <Button title="保存" onPress={e => this.submit()}>
     submit(){
          this.form.validate().then(e => {
              // 无错误
          }).catch(errors => { // errors = [{element: Input, message: 'error'}, ...]
              // 有错误
          })
     }
```