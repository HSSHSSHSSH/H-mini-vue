import { patch } from '../render'
import { reactive, effect } from '../../../../reactivity/index'
import { queueJob } from './queueJob'
import { CompInstance } from './instance'

// 挂载组件
export function mountComponent(vnode, container, options, anchor) {
  console.log('挂载 租价', vnode)
  // 通过 vnode.type 获取组件的描述对象
  const componentOptions = vnode.type
  // 获取描述对象的 render 函数与内部状态
  const {
    render,
    data,
    props: propsOptions,
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
  // 解析组件 props
  const [props, attrs] = resolveProps(propsOptions, vnode.props)

  // 调用 render 函数，返回组件的 vnode
  // 组件内部状态更新时，更新视图
  const instance = new CompInstance(vnode, state, props)
  vnode.component = instance
  // 调用 created 钩子
  const renderContext = createRenderContext(instance)
  created && created.call(renderContext)
  effect(
    () => {
      const subTree = render.call(renderContext, renderContext) // 设置 this 的指向
      instance.subTree = subTree
      console.log(subTree)
      // 将组件的 vnode 挂载到 container 上
      // 检查组件是否已被挂载
      if (!instance.isMounted) {
        // 调用 beforeMounted 钩子
        beforeMount && beforeMount.call(renderContext)
        patch(null, subTree, container, options)
        instance.isMounted = true
        // 调用 mounted 钩子
        mounted && mounted.call(renderContext)
      } else {
        // 调用 beforeUpdate 钩子
        beforeUpdate && beforeUpdate()
        patch(instance.subTree, subTree, container, options)
        // 调用 updated 钩子
        updated && updated.call(renderContext)
      }
      instance.subTree = subTree
    },
    { scheduler: queueJob }, // scheduler 避免不必要的渲染操作
  )
}

// 更新组件
export function patchComponent(n1, n2, options, anchor) {
  const instance = (n2.component = n1.component)
  // 获取当前 props 数据
  const props = instance.props
  updateProps(n1, n2, props)
}


// 解析组件传参
function resolveProps(options, propsData) {
  const props = {}
  const attrs = {}
  for (const key in propsData) {
    if(key in options) {
      // 若为组件传递的 props 在组件描述对象中存在，则视为合法的 props
      props[key] = propsData[key]
    } else {
      // 若为组件传递的 props 在组件描述对象中不存在，则视为非法的 props
      attrs[key] = propsData[key]
    }
  }
  return [props, attrs]
}

// 检测 props 是否发生变化
function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  if(nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if(nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
}

// 更新 props

function updateProps(n1, n2, props) {
  // 检测 props 是否发生变化
  if(hasPropsChanged(n1.props, n2.props)) {
    // 若 props 发生变化，则更新 props
    const [nextProps] = resolveProps(n2.type, n2.props)
    // 更新 props
    for (const key in nextProps) {
      props[key] = nextProps[key]
    }
    // 删除不存在的 props
    for (const key in n1.props) {
      if(!(key in nextProps)) {
        delete props[key]
      }
    }
  }
}

/**
 * 
 * @param instance 
 * @returns 
 * 创建渲染上下文
 * 在对数据进行读取操作时，首先会在 state 中查找，若 state 中不存在，则会在 props 中查找
 */

function createRenderContext(instance) {
  return new Proxy(instance, {
    get(target, key) {
      const {state, props} = target
      if(key in state) {
        return state[key]
      } else if(key in props) {
        return props[key]
      } else {
        return undefined
      }
    },
    set(target, key, value) {
      const {state, props} = target
      if(key in state) {
        state[key] = value
      } else if(key in props) {
        props[key] = value
      } else {
        console.warn('设置的属性不存在')
      }
      return true
    }
  })
}