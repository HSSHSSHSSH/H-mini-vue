// 组件实例，描述与组件有关的状态信息
import {shallowReactive} from '../../../reactivity/index'

let currentInstance: CompInstance | null = null

export class CompInstance {
  public vnode: any = null // 虚拟节点
  public isMounted = false // 是否挂载
  public state: any // 组件内部状态信息
  public subTree: any = null // 渲染内容
  public props: any = null // 组件的 props
  public el: any = null // 组件的 DOM 元素
  public lifeCycle: { [key: string]: Array<() => void> } = {
    onBeforeMount: [],
    onMounted: [],
    onBeforeUpdate: [],
    onUpdated: [],
};
  

  constructor(vnode,state, props) {
    this.vnode = vnode
    this.state = state
    this.props = shallowReactive(props)
  }
}


export function setCurrentInstance (instance: CompInstance|null) {
  currentInstance = instance
}


export function lifeCycleRegister(fn: () => void, lifeCycle: string) {
  if(currentInstance) {
    currentInstance.lifeCycle[lifeCycle].push(fn)
  } else {
    console.error('onMounted 必须在 setup 函数中调用')
  }
}


export function onBeforeMount (fn: () => void) {
  lifeCycleRegister(fn, 'onBeforeMount')
}

export function onMounted (fn: () => void) {
  lifeCycleRegister(fn, 'onMounted')
}

export function onBeforeUpdate (fn: () => void) {
  lifeCycleRegister(fn, 'onBeforeUpdate')
}

export function onUpdated (fn: () => void) {
  lifeCycleRegister(fn, 'onUpdated')
}


