import { ShapeFlags } from '../../shared/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')


export {createVNode as createElementVNode}

export function createVNode(type, props: any = {}, children?) {
  const vnode = {
    type,
    props,
    children,
    key: props && props.key,
    component: null,
    shapeFlag: getShapeFlag(type),
    el: null,
  }
  // 判断 children 类型
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}

export function createTextNode(text: string) {
  return createVNode(Text, {}, text)
}

function getShapeFlag(type) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
