# react-native-validator

可用功能

        import {
            ValidatorContainer,
            wrapContainer,
            wrapElement,
            setHandler,
            checkRule,
            rules,
            exec,
            and,
            or
        } from 'react-native-validator'

## 组件增加验证功能
1. 给容器组件添加验证方法，可以调用组件实例的 validate 方法验证内部的表单组件（或者使用自带的 ValidatorContainer 容器组件包裹所有表单），假设你已经有一个 Form 组件，它是表单的容器组件

        import validator from 'react-native-validator'
        ...
        export default validator.wrapContainer(Form) // 使用 HOC 模式给 Form 组件增加 validate 方法

2. 给表单组件增加验证规则，可以在组件上配置 validator 规则描述，假设你已经有一个 Input 组件，它是表单元素

        import validator from 'react-native-validator'
        ...
        let propKeyMap = {
            nameKey: 'label', // 从 WrappedComponent 组件获取，传递给验证器的 name 属性名
            valueKey: 'value', // 从 WrappedComponent 组件获取，传递给验证器的 value 属性名）
            skipKey: 'disabled', // 从 WrappedComponent 组件获取，当 skipKey 属性为 true 时跳过验证
            invalidKey: 'invalid', // 给 WrappedComponent 组件添加，验证失败的属性名
            messageKey: 'message' // 给 WrappedComponent 组件添加，验证失败提示信息的属性名
        }
        export default validator.wrapElement(Input, propKeyMap)

3. 给验证器增加默认错误处理函数，默认为Alert第一个错误信息

        import validator from 'react-native-validator'
        validator.setHandler(function(errors){
            // errors = [{element, message}, ...]
            // 错误处理逻辑
        })

## 使用验证组件

1. 拿到 form 实例

        <Form ref={instance => this.form = instance}> xxx </Form>

2. 编写验证规则，或者直接使用自带的默认的规则集

        let required = { // 函数验证规则
            rule: v => v === '' || v === undefined || v === null,
            message: "{name}不能为空"
        }
        let digit = { // 正则验证规则
            rule: /^\d+$/,
            message: '{name}只允许输入数字'
        }
        let range = (min, max) => ({ // 动态参数验证规则，使用函数闭包传递参数
            rule: v => Number(v) > Number(min) && Number(v) < Number(max),
            message: `{name}必须在${min}和${max}之间`
        })
        let mygt = { // 传递参数
            rule: (val, param) => val > param.min,
            message: '{name}必须大于{min}'
        }
        // 自定义规则和提示信息
        let rateNumber = function (value, param) {
            if (!v.number.rule(value)) { // 使用内置验证器
                return '客房价格必须是数字'
            }
            if (!v.min(0).rule(value)) {
                return '客房价格必须大于 0'
            }
            if (!v.maxlength(6).rule(value)) {
                return '客房价格最多 6 位数'
            }
        }

    * 使用编写好的验证规则 required

            <Input label="用户名" validator={{validate: required}} /> // 用户名不能为空

    * 使用默认验证规则，传递 message 参数，默认传递 { name: label } 参数

            <Input label="用户名" validator={{validate: rules.required}} /> // 不能为空
            <Input label="用户名" validator={{validate: rules.required, name: '密码'}} /> // 密码不能为空

    * 使用默认验证规则，覆盖提示信息

            <Input label="用户名" validator={{validate: v.required, message: '请输入用户名'}} />

    * 使用带参数的验证规则

            <Input label="金额" validator={{validate: v.range(0, 10), name: '金额'}} /> // 金额必须在0和10之间
            也可以使用属性传递验证参数（不推荐，已废弃）
            let myrange = {
                rule: (value, param) => value > param.min && value < param.max
                message: '{name}必须必须在{min}和{10}之间'
            }
            <Input label="金额" validator={{validate: myrange, name: '金额', min: 0, max: 10}} /> // 金额必须在0和10之间

    * 使用组合多个验证规则 and or 组合规则

            现在还不支持数组嵌套组合
                let { required, gt, lt, range } = rules
                and(required, [gt(0), lt(10)]) // 异常
                and(required, and(gt(0), lt(10))) // 正确
            <Input validator={{validate: [required, gt(0)]}} /> 必填 且 大于0
            <Input validator={{validate: and(required, range(0, 1)]}} />  必填 且 在0到1之间 // 和数组等价
            <Input validator={{validate: or(lt(1), gt(10))}} /> 小于1 或 大于10

3. 调用 form 的验证方法（promise）

        <Button title="保存" onPress={e => this.submit()}>
        submit(){
            this.form.validate().then(e => {
                // 无错误
            }).catch(errors => { // errors = [{element: Input, message: 'error'}, ...]
                // 有错误
            })
        }