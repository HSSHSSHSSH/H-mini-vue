
import { createRenderer } from '../../../lib/guide-mini-vue.esm.js'
const renderer = createRenderer({
  // 用于创建元素
  createElement(tag) {
    return document.createElement(tag)
  },
  // 用于设置文本节点
  setElementText(el,text) {
    el.innerHTML = text
  },
  // 用于在给定 parent 上挂在 vnode
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  }
})
const vnode = {
  type: 'h1',
  children: '乌迪尔!! 乌迪尔!!!!!!!'
}
renderer(vnode, document.getElementById('app'))
