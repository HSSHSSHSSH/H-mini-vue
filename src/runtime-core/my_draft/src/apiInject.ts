import { getCurrentInstance } from './component'

/**
 *
 * @param key
 * @param val
 * 注入参数以供后代组件使用
 * 必须在 setup 函数中调用
 */
export function provide(key: string, val: any) {
  console.log('provide调用', key, val)
  let currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides) // 原型链指向父组件的 provide 避免污染 只执行一次
    }
    provides[key] = val
  }
}

/**
 *
 * @param key
 * 取出父组件注入的参数
 * 必须在 setup 函数中使用
 */
export function inject(key: string, defaultValue?: any) {
  console.log('inject调用', key)
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    const { parent } = currentInstance
    const parentProvides = parent.provides
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) { // 若父组件没有注入该参数，则使用默认值
      if(typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}
