import { isObject } from "../shared"
import { track, trigger } from "./effect"
import { ReactiveFlags, reactive, readonly } from "./reactive"


const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)
const shallowReactiveGet = createGetter(false, true)



function createGetter(isReadonly: boolean = false, isShallow: boolean = false) {
  return function get(target, key) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    const res = Reflect.get(target, key)

    if (!isReadonly) {
      // 依赖收集
      track(target, key)
    }

    if(isShallow) {
      return res
    }

    if(isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

   
    return res
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
  }
}

export const shallowReactiveHandlers = {
  get: shallowReactiveGet,
  set
}

export const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {get :shallowReadonlyGet})