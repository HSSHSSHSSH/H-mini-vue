import { createRenderer, effect, ref, NodeFlags } from '../../../lib/guide-mini-vue.esm.js'
import {
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount,
  createText,
  createComment,
  setNodeText,
} from './handlers/elementHandlers.js'
const renderer = createRenderer({
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount,
  createText,
  createComment,
  setNodeText,
})

const vnode = {
  type: NodeFlags.Fragment,
  children: [
    {
      type: 'li',
      children: '蛙!!!'
    },
    {
      type: 'li',
      children: '叫!!!'
    },
    {
      type: 'li',
      children: '你!!!'
    },
  ],
}
renderer(vnode, document.getElementById('app'))
