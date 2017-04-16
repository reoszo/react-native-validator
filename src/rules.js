function str(v) { // 转换 string
    return (str === null || str === undefined) ? '' : String(v)
}

export default rules = {
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
    number: { // 增加正数、负数、整数、小数等快捷规则。。。？
        rule: /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/,
        message: "{name}必须为数值类型"
    },
    alpha: {
        rule: /^[a-zA-z\s]+$/,
        message: "{name}只能包含字母"
    },
    alphaspace: {
        rule: /^[a-zA-z\s]+$/,
        message: "{name}只能包含字母和空格"
    },
    alphanumeric: {
        rule: /^[a-zA-Z0-9]+$/,
        message: "{name}只允许输入字母和数字"
    },
    alphanumeric_: {
        rule: /^([a-zA-Z0-9_])+$/,
        message: "{name}只能包含字母、数字和下划线"
    },
    alphanumericdash: {
        rule: /^([a-zA-Z0-9-])+$/,
        message: "{name}只能包含字母、数字和横线"
    },
    alphanumeric_dash: {
        rule: /^([a-zA-Z0-9-_])+$/,
        message: "{name}只能包含字母、数字、横线和下划线"
    },
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
        rule: v => Number(v) > n,
        message: `{name}必须大于${n}`
    }),
    gte: n => ({
        rule: v => Number(v) >= n,
        message: `{name}必须大于等于${n}`
    }),
    lt: n => ({
        rule: v => Number(v) < n,
        message: `{name}必须小于${n}`
    }),
    lte: n => ({
        rule: v => Number(v) <= n,
        message: `{name}必须小于等于${n}`
    }),
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
    email: {// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
        rule: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        message: "{value}不是有效的电子邮件地址"
    },
    url: { // https://gist.github.com/dperini/729294 see also https://mathiasbynens.be/demo/url-regex
        rule: /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i,
        message: "{value}不是有效的网址"
    },
    date: {
        rule: v => !/Invalid|NaN/.test(new Date(v).toString()),
        message: '{value}不是有效的日期'
    },
    dateISO: {
        rule: /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/,
        message: '{value}不是有效的日期 (YYYY-MM-DD)'
    },
    creditcard: { // http://en.wikipedia.org/wiki/Luhn_algorithm
        rule: function (value) {
            // accept only spaces, digits and dashes
            if (/[^0-9 \-]+/.test(value)) {
                return false;
            }
            let nCheck = 0,
                nDigit = 0,
                bEven = false,
                n, cDigit;
            value = value.replace(/\D/g, "");
            // Basing min and max length on
            // http://developer.ean.com/general_info/Valid_Credit_Card_Types
            if (value.length < 13 || value.length > 19) {
                return false;
            }
            for (n = value.length - 1; n >= 0; n--) {
                cDigit = value.charAt(n);
                nDigit = parseInt(cDigit, 10);
                if (bEven) {
                    if ((nDigit *= 2) > 9) {
                        nDigit -= 9;
                    }
                }
                nCheck += nDigit;
                bEven = !bEven;
            }
            return (nCheck % 10) === 0;
        },
        message: "{value}不是有效的信用卡格式"
    }
}