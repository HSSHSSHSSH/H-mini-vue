// 组件实例，描述与组件有关的状态信息
import {shallowReactive} from '../../../../reactivity/index'
export class CompInstance {
  public vnode: any = null // 虚拟节点
  public isMounted = false // 是否挂载
  public state: any // 组件内部状态信息
  public subTree: any = null // 渲染内容
  public props: any = null // 组件的 props

  constructor(vnode,state, props) {
    this.vnode = vnode
    this.state = state
    this.props = shallowReactive(props)
  }
}