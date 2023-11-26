import { Fragment, createVNode } from '../vnode'

export function renderSlots(slots, name, props) {
  let children
  if (name) {
    let slot = slots[name]
    if (slot) { // 具名插槽与插槽函数
      if(typeof slot === 'function') {
        children = slot(props)
        // return createVNode('Fragment', {}, slot(props))

      } else {
        children = slot
        // return createVNode('Fragment', {}, slot)
      }
    }
  } else { // 单个插槽与多个插槽
    children = slots
    // return createVNode('Fragment', {}, slots)
  }
  return createVNode(Fragment, {}, children)
}
