

export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function isString(value) {
  return typeof value === 'string'
}



// 将字符串首字母大写
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 将事件名转换为 on 开头的驼峰形式
export function toHandlerKey(str) {
  return str ? 'on' + capitalize(str) : ''
}

// 将连字符形式转换为驼峰形式
export function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}