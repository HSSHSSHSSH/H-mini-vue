import { ShapeFlags } from "../../../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vnode"

export function render(vnode, container) {
  // 调用 patch
  patch(vnode, container)
}

// patch 处理虚拟节点
function patch(vnode, container) {
  const {type, shapeFlag} = vnode
  switch(type) {
    case Fragment:
      processFragment(vnode, container)
      break
    case Text:
      processText(vnode, container)
      break
    default:
    if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 处理组件 component
      processComponent(vnode, container)
    } else if (shapeFlag & ShapeFlags.ELEMENT) {
      // 处理元素 element
      processElement(vnode, container)
    }
      break
  }
}



// 处理文本节点
function processText(vnode, container) {
  const {children} = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.appendChild(textNode)
}

/**
 * 处理 Fragment 节点
 * @param vnode 
 * @param container 
 * 对于 Fragment 节点，只需处理其 children 即可
 */
function processFragment(vnode, container) {
  mountChildren(vnode, container)
}

// 处理 element 节点
function processElement(vnode, container) {
  mountElement(vnode, container)
}



// 挂载 element 节点
function mountElement(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.type))
  const {children, shapeFlag} = vnode
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {

    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el)
  }

  const {props} = vnode
  if(props) {
    for (const key in props) {
      const val = props[key]
      const isOn = (key) => /^on[A-Z]/.test(key)
      if(isOn(key)) {
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
function mountChildren(vnode, container) {
  vnode.children.forEach(v => {
    patch(v, container)
  })
}


function processComponent(vnode, container) {
  mountComponent(vnode, container)
}


function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode)
  // 处理 setup 函数
  setupComponent(instance)
  // 渲染
  setupRenderEffect(instance, container)
}


function setupRenderEffect(instance, container) {
  const subTree = instance.render.call(instance.proxy)
  patch(subTree, container)
  instance.vnode.el = subTree.el
}



