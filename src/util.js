// {
//     message: "hello {name} \n hello '{'name'}'",
//     param: {
//         name: 'world'
//     }
// }
export function formatMessage(message, param) {
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