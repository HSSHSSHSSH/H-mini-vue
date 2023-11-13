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
  type: 'div',
  props: {
    onClick: () => {
      alert('父元素 clicked')
    },
  },
  children: [
    {
      type: NodeFlags.Text,
      children: '蛙叫你'
    },
    {
      type: NodeFlags.Comment,
      children: '乌迪尔乌迪尔'
    }
  ],
}
renderer(vnode, document.getElementById('app'))
