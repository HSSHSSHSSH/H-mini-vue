// my_render
export * from './render/render'
export * from './render/flags'
export {
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
} from './render/component/instance'

// -------\
export * from './src/h'
export { renderSlots } from './src/helper/renderSlots'
export { createTextNode, createElementVNode } from './src/vnode'
export { getCurrentInstance, registerRuntimeCompiler } from './src/component'
export { provide, inject } from './src/apiInject'
export { createRenderer } from './src/render'
export { toDisplayString } from '../shared'
export * from '../reactivity'
