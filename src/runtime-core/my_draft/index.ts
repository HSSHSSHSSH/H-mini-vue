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
export { createApp } from './src/createApp'
export * from './src/h'
export { renderSlots } from './src/helper/renderSlots'