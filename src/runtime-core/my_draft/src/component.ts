import { shallowReadonly } from "../../../reactivity/reactive"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: emit,
  }
  component.emit = emit.bind(null, component) as any
  return component
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
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'object') {
    // 若 setupResult 是对象,则将此对象注入组件上下文中
    instance.setupState = setupResult
  }
  // 确保 render 函数合法
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  if (Component.render) {
    instance.render = Component.render
  }
}
