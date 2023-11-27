import { effect } from '../../../index'
import { ShapeFlags } from '../../../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'

export function render(vnode, container, parentComponent?) {
  // 调用 patch
  patch(null, vnode, container, parentComponent)
}

// patch 处理虚拟节点
function patch(n1, n2, container, parentComponent) {
  const { type, shapeFlag } = n2
  switch (type) {
    case Fragment:
      processFragment(n1, n2, container, parentComponent)
      break
    case Text:
      processText(n1,n2, container)
      break
    default:
      if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件 component
        processComponent(n1,n2, container, parentComponent)
      } else if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理元素 element
        processElement(n1,n2, container, parentComponent)
      }
      break
  }
}

// 处理文本节点
function processText(n1, n2, container) {
  const { children } = n2 // todo
  const textNode = (n2.el = document.createTextNode(children))
  container.appendChild(textNode)
}

/**
 * 处理 Fragment 节点
 * @param vnode
 * @param container
 * 对于 Fragment 节点，只需处理其 children 即可
 */
function processFragment(n1, n2, container, parentComponent) {
  mountChildren(n2, container, parentComponent)
}

// 处理 element 节点
function processElement(n1, n2, container, parentComponent) {
  if(!n1) {
    mountElement(n2, container, parentComponent)
  } else {
    patchElement(n1, n2, container)
  }
}


// 更新 element 节点 
function patchElement(n1, n2, container) {
  // 更新 props 
  patchProps(n1, n2)
  console.log('更新 element 节点')
}

// 更新 props 
function patchProps(n1, n2) {
  
}

// 挂载 element 节点
function mountElement(vnode, container, parentComponent) {
  const el = (vnode.el = document.createElement(vnode.type))
  const { children, shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el, parentComponent)
  }

  const { props } = vnode
  if (props) {
    for (const key in props) {
      const val = props[key]
      const isOn = (key) => /^on[A-Z]/.test(key)
      if (isOn(key)) {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, val)
      } else {
        el.setAttribute(key, val)
      }
    }
  }
  container.appendChild(el)
}

// children 是数组时，递归处理
function mountChildren(n2, container, parentComponent) {
  n2.children.forEach((v) => {
    patch(null,v, container, parentComponent)
  })
}

function processComponent(n1, n2, container, parentComponent) {
  mountComponent(n2, container, parentComponent)
}

function mountComponent(vnode, container, parentComponent) {
  const instance = createComponentInstance(vnode, parentComponent)
  // 处理 setup 函数
  setupComponent(instance)
  // 渲染
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance, container) {
  effect(() => {
    const {proxy} = instance
    if(!instance.isMounted) {
      const subTree = (instance.subTree = instance.render.call(proxy))
      patch(null ,subTree, container, instance)
      instance.vnode.el = subTree.el
      instance.isMounted = true
    } else {
      const subTree = instance.render.call(proxy)
      const prevSubTree = instance.subTree
      instance.subTree = subTree
      patch(prevSubTree, subTree, container, instance)
    }
  })
}
