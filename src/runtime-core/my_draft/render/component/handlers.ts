import { patch } from '../render'
import { reactive, effect } from '../../../../reactivity/index'
import { queueJob } from './queueJob'
import { CompInstance } from './instance'

export function mountComponent(vnode, container, options, anchor) {
  console.log('挂载 租价', vnode)
  // 通过 vnode.type 获取组件的描述对象
  const componentOptions = vnode.type
  // 获取描述对象的 render 函数与内部状态
  const {
    render,
    data,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
  } = componentOptions
  // 调用 beforeCreate 钩子
  beforeCreate && beforeCreate()
  const state = reactive(data())

  // 调用 render 函数，返回组件的 vnode
  // 组件内部状态更新时，更新视图
  const instance = new CompInstance(vnode, state)
  vnode.component = instance
  // 调用 created 钩子
  created && created.call(state)
  effect(
    () => {
      const subTree = render.call(state, state) // 设置 this 的指向
      // 将组件的 vnode 挂载到 container 上
      // 检查组件是否已被挂载
      if (!instance.isMounted) {
        // 调用 beforeMounted 钩子
        beforeMount && beforeMount()
        patch(null, subTree, container, options)
        instance.isMounted = true
        // 调用 mounted 钩子
        mounted && mounted()
      } else {
        // 调用 beforeUpdate 钩子
        beforeUpdate && beforeUpdate()
        patch(instance.subTree, subTree, container, options)
        // 调用 updated 钩子
        updated && updated()
      }
      instance.subTree = subTree
    },
    { scheduler: queueJob }, // scheduler 避免不必要的渲染操作
  )
}

export function patchComponent(n1, n2, options, anchor) {
  console.log('更新 租价')
}
