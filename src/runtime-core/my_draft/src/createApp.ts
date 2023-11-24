
/**
 * 接受 DOM 元素作为参数，将 DOM 转化为 vnode, 之后所有的操作都针对与 vnode 
 */

import { render } from "./render"
import { createVNode } from "./vnode"

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      const root_container = document.getElementById(rootContainer.slice(1))
      const vnode = createVNode(rootComponent)
      render(vnode, root_container)
    }
  }
}



