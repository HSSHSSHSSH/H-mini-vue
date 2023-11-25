import { createVNode } from '../vnode'

export function renderSlots(slots, name, props) {
  // debugger
  if (name) {
    let slot = slots[name]
    if (slot) { // 具名插槽与插槽函数
      if(typeof slot === 'function') {
        return createVNode('div', {}, slot(props))

      } else {

        return createVNode('div', {}, slot)
      }
    }
  } else { // 单个插槽与多个插槽
    return createVNode('div', {}, slots)
  }
}
