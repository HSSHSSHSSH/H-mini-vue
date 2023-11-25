export function initSlots(instance, children) {
  // debugger
  console.log('children', children)
  if (
    typeof children === 'object' &&
    !Array.isArray(children) &&
    !children.hasOwnProperty('shapeFlag')
  ) {
    // 具名插槽 插槽函数
    normalizeObjectSlots(instance, children)
  } else {
    // 单个节点 多个节点
    instance.slots = normalizeSlotValue(children)
  }
}

function normalizeObjectSlots(instance, children) {
  const slots = {}
  for (const key in children) {
    const value = children[key]
    slots[key] = typeof value === 'function' ? (props) => normalizeSlotValue(value(props)) : normalizeSlotValue(value)
  }
  instance.slots = slots
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value]
}
