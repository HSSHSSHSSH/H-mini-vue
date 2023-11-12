// import { track, trigger } from './effect'
const { track, trigger } = require('./effect')

 function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // 依赖收集
      track(target, key)
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      // 触发依赖
      let res = Reflect.set(target, key, value)
      trigger(target, key)
      return res
    },
  })
}

module.exports = {
  reactive
}