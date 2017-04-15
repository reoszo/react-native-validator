# react-native-validator

## 组件增加验证功能
1. 给容器组件添加验证方法，可以调用组件实例的 validate 方法验证内部的表单组件
    假设你已经有一个 Form 组件，它是表单的容器组件
```
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
    假设你已经有一个 Input 组件
```
    原 Input 组件代码
        import {Component} from 'react'
        ....
        export default class Input extends Component {
            ...
        }
        ...
    
    改为
        import {Component} from 'react'
        import v from 'react-native-validator' // 改动1、增加引用
            ....
            class Input extends Component { // 改动2、去除原 export default
                ...
            }
            ...
            export default v.wrapValidatorElement(Input) // 改动3、改为 export defaut 包装结果
```

## 使用验证组件

1. 拿到 form 实例
     <Form ref={instance => this.form = instance}> xxx </Form>

2. 编写验证规则，或者直接使用 v 中默认的规则集

     let required = {
         rule: v => !!v, // 可以直接使用默认验证器 v => v.and(v.required)(v)
         message: '酒店名称不能为空'
     }
     使用编写好的验证规则 required
         <Input validator={{validate: required}} /> // 酒店名称不能为空
     使用默认验证规则，传递 message 参数，默认传递 { name: label, value: value } 参数
         <Input validator={{validate: v.required, name: '酒店名称'}} />
     使用默认验证规则，覆盖提示信息
         <Input validator={{validate: v.required, message: '酒店名称不能为空'}} />

     使用带参数的验证规则
         默认使用函数传递验证参数
             v.gt: n => ({
                 rule: v => v > n,
                 message: `{name}必须大于${n}`
             })
             <Input validator={{validate: v.gt(0), name: '金额'}} /> // 金额必须大于0
         使用属性传递验证参数（不推荐，为了兼容旧代码）
             let mygt = {
                 rule: (val, param) => val > param.min
                 message: '{name}必须大于{min}'
             }
             <Input validator={{validate: mygt, name: '金额', min: 0}} /> // 金额必须大于0

     使用组合多个验证规则 and or 组合规则，添加自定义组合规则详见方法 combineRule
     现在还不支持数组嵌套组合 v.and(v.required, [v.gt(0), v.lt(10)]) 需要修改为 v.and(v.required, v.and(v.gt(0), v.lt(10)))
         <Input validator={{validate: [v.required, v.gt(0)]}} /> 必填 且 大于0
         <Input validator={{validate: v.and(v.required, v.range(0, 1)]}} />  必填 且 在0到1之间 // 和数组等价
         <Input validator={{validate: v.or(v.lt(1), v.gt(10))}} /> 小于1 或 大于10

3. 调用 form 的验证方法
     <Button title="保存" onPress={e => this.submit()}>
     submit(){
          this.form.validate().then(e => {
              // 无错误
          }).catch(errors => { // errors = [{element: Input, message: 'error'}, ...]
              // 有错误
          })
     }
```