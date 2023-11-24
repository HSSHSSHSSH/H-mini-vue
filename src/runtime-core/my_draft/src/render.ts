import { ShapeFlags } from "../../../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  // 调用 patch
  patch(vnode, container)
}

// patch 处理虚拟节点
function patch(vnode, container) {
  const {shapeFlag} = vnode
  if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理组件 component
    
    processComponent(vnode, container)
  } else if (shapeFlag & ShapeFlags.ELEMENT) {
    // 处理元素 element
    processElement(vnode, container)
  }
}


function processElement(vnode, container) {
  mountElement(vnode, container)
}


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
      el.setAttribute(key, props[key])
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



