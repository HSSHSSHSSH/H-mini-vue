import { track, trigger } from "./effect"


const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)



function createGetter(isReadonly: boolean = false) {
  return function get(target, key) {
   if (!isReadonly) {
     // 依赖收集
     track(target, key)
   }
    return Reflect.get(target, key)
  }
}

function createSetter() {
  return function set(target, key, value) {
    let res = Reflect.set(target, key, value)
    // 触发依赖
    trigger(target, key)
    return res
  }
}


export const mutableHandlers = {
  get,
  set
}


export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn('只读属性，虾吗？')
    return true
  },
}