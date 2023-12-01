import { patch } from '../render'
import { reactive, effect } from '../../../reactivity/index'
import { queueJob } from './queueJob'
import { CompInstance, setCurrentInstance, lifeCycleRegister } from './instance'
import { shallowReadonly } from '../../../reactivity/reactive'

// 挂载组件
export function mountComponent(vnode, container, options, anchor) {
  // 通过 vnode.type 获取组件的描述对象
  const componentOptions = vnode.type
  // 获取描述对象的 render 函数与内部状态
  let {
    render,
    data,
    props: propsOptions,
    setup,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
  } = componentOptions
  // 调用 beforeCreate 钩子
  beforeCreate && beforeCreate()
  const state = data ? reactive(data()) : null
  // 解析组件 props
  const [props, attrs] = resolveProps(propsOptions, vnode.props)
  const instance = new CompInstance(vnode, state, props)
  const emit = createEmit(instance)
  let { render: new_render, setupState } = handleSetup(
    setup,
    render,
    instance,
    attrs,
    emit
  )
  if (!setupState) {
    render = new_render
  }
  vnode.component = instance
  const renderContext = createRenderContext(instance, setupState)
  // 调用 created 钩子
  created && created.call(renderContext)
  // 调用 render 函数，返回组件的 vnode
  // 组件内部状态更新时，更新视图
  reactiveRender(
    // 注册渲染函数
    render,
    renderContext,
    instance,
    container,
    options,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
  )
}

// 更新组件
export function patchComponent(n1, n2, options, anchor) {
  const instance = (n2.component = n1.component)
  // 获取当前 props 数据
  const props = instance.props
  updateProps(n1, n2, props)
  console.log('更新组件')
}

/**
 * 
 * @param event 
 * @param payload
 * 注册事件处理函数
 * 将事件名称前加 on 并大写首字母，作为事件处理函数的名称，在 props 上查找对丁的事件处理函数 
 */
function createEmit(instance: CompInstance) {
  return function emit(event: string, ...payload: any[]) {
    const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`
    let handler = instance.props[eventName]
    if(handler) {
      handler(...payload)
    } else {
      console.log('事件不存在')
    }
  }
}

// 注册副作用函数
function reactiveRender(
  render: Function,
  renderContext: any,
  instance: CompInstance,
  container: any,
  options: any,
  beforeMount: Function | null = null,
  mounted: Function | null = null,
  beforeUpdate: Function | null = null,
  updated: Function | null = null,
) {
  effect(
    () => {
      const subTree = render.call(renderContext, renderContext) // 设置 this 的指向
      // instance.subTree = subTree
      // 将组件的 vnode 挂载到 container 上
      // 检查组件是否已被挂载
      if (!instance.isMounted) {
        // 调用 beforeMounted 钩子
        beforeMount && beforeMount.call(renderContext)
        instance.lifeCycle.onBeforeMount.forEach((fn) => fn.call(renderContext))
        patch(null, subTree, container, options)
        instance.isMounted = true
        // 调用 mounted 钩子
        instance.lifeCycle.onMounted.forEach((fn) => fn.call(renderContext))
        mounted && mounted.call(renderContext)
      } else {
        console.log('组件更新')
        // 调用 beforeUpdate 钩子
        beforeUpdate && beforeUpdate()
        instance.lifeCycle.onBeforeUpdate.forEach((fn) =>
          fn.call(renderContext)
        )
        patch(instance.subTree, subTree, container, options)
        // 调用 updated 钩子
        updated && updated.call(renderContext)
        instance.lifeCycle.onUpdated.forEach((fn) => fn.call(renderContext))
      }
      instance.subTree = subTree
      instance.el = subTree.el
    },
    { scheduler: queueJob }, // scheduler 避免不必要的渲染操作
  )
}

/**
 * 
 * @param options 组件传参的格式
 * @param propsData  实际传递的参数
 * @returns 
 * 通过 options 与 propsData 解析 props, 分出合法 props 与非法 attrs
 */
function resolveProps(options = {}, propsData = {}) {
  const props = {}
  const attrs = {}
  for (const key in propsData) {
    if (key in options || key.startsWith('on')) { // 事件名称以 on 开头， 虽未在 props 中显式声明，也视为合法
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
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
}

// 更新 props

function updateProps(n1, n2, props) {
  // 检测 props 是否发生变化
  if (hasPropsChanged(n1.props, n2.props)) {
    // 若 props 发生变化，则更新 props
    const [nextProps] = resolveProps(n2.type, n2.props)
    // 更新 props
    for (const key in nextProps) {
      props[key] = nextProps[key]
    }
    // 删除不存在的 props
    for (const key in n1.props) {
      if (!(key in nextProps)) {
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

//q: 为什么不直接使用 instance 作为上下文
function createRenderContext(instance: CompInstance, setupState: any = null) {
  return new Proxy(instance, {
    get(target, key) {
      const { state, props } = target
      if (state && key in state) { // 添加是否存在的判断  以下同理
        return state[key]
      } else if (props && key in props) {
        return props[key]
      } else if (setupState && key in setupState) {
        // 增加对 setupState 的支持
        return setupState[key]
      } else {
        return undefined
      }
    },
    set(target, key, value) {
      const { state, props } = target
      if (state && key in state) {
        state[key] = value
      } else if (props && key in props) {
        props[key] = value
      } else if (setupState && key in setupState) {
        // 增加对 setupState 的支持
        setupState[key] = value
      } else {
        console.warn('设置的属性不存在')
      }
      return true
    },
  })
}

// 处理 setup 函数

function handleSetup(
  setup: Function,
  render: Function | null,
  instance: CompInstance,
  attrs: any,
  emit: Function
) {
  setCurrentInstance(instance)
  let setupState = null
  if (setup) {
    const setupContext = { attrs, emit }
    const setupResult = setup(shallowReadonly(instance.props), setupContext)
    // 处理 setup 返回值
    if (typeof setupResult === 'function') {
      // 返回值为一函数
      // 判断渲染函数是否冲突
      if (render) {
        console.warn('setup 函数返回值与 render 函数冲突')
      }
      render = setupResult
    } else {
      // 返回值为一对象
      setupState = setupResult
    }
  }
  setCurrentInstance(null)
  return {
    render,
    setupState,
  }
}
