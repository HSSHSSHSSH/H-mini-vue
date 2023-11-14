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
    {type: 'p', children: '2', key: 2},
    {type: 'p', children: 'hello', key: 3},
    {type: 'p', children: '蛙叫你', key: 4}

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
    {type: 'p', children: '4', key: 4},
    {type: 'p', children: '2', key: 2},
    {type: 'p', children: '1', key: 1},
    {type: 'p', children: 'world', key: 3}
  ],
}
renderer(vnode, document.getElementById('app'))
