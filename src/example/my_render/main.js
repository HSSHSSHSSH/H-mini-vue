import { 
  createRenderer, 
  effect, 
  ref, 
  NodeFlags,
} from '../../../lib/guide-mini-vue.esm.js'
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

let count = ref(1)

const vnode = {
  type: 'div',
  props: {
    onClick: () => {
      renderer(new_vnode, document.getElementById('app'))
    }
  },
  children: [
    {type: 'p', children: '1', key: 1},
    {type: 'p', children: '3', key: 3},
    {type: 'p', children: '2', key: 2},
    {type: 'p', children: '4', key: 4},
    {type: 'p', children: '6', key: 6},
    {type: 'p', children: '5', key: 5},
  ],
}


const new_vnode = {
  type: 'ul',
  props: {
    onClick: () => {
      renderer(vnode, document.getElementById('app'))
    }
  },
  children: [
    {type: 'p', children: '1', key: 1},
    {type: 'p', children: '2', key: 2},
    {type: 'p', children: '3', key: 3},
    {type: 'p', children: '4', key: 4},
    {type: 'p', children: '6', key: 6},
    {type: 'p', children: '5', key: 5},
  ],
}
renderer(vnode, document.getElementById('app'))
