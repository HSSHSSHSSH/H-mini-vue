import { shallowReadonly } from "../../reactivity/reactive"
import { proxyRefs } from "../../reactivity/ref"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

let currentInstance = null

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    next: null,
    provides: parent && parent.provides ? parent.provides : {}, // 跨组件层传递
    parent,
    isMounted: false,
    subTree: {},
    emit: emit,
  }
  component.emit = emit.bind(null, component) as any
  return component
}

export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance) {
  currentInstance = instance
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type
  const { setup } = Component
  // ctx 组件访问代理对象
  instance.proxy = new Proxy(
    {_: instance},
    PublicInstanceProxyHandlers
  )
  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'object') {
    // 若 setupResult 是对象,则将此对象注入组件上下文中
    instance.setupState = proxyRefs(setupResult)
  }
  // 确保 render 函数合法
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  if(compiler && !Component.render) {
    if(Component.template) {
      console.log('蛙叫你')
      Component.render = compiler(Component.template)
    }
  }
  // if (Component.render) {
    instance.render = Component.render
  // }
}

let compiler 

export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler
}

