import { createRenderer, effect, ref } from '../../../lib/guide-mini-vue.esm.js'
import {
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount,
} from './handlers/elementHandlers.js'
const renderer = createRenderer({
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount,
})




  const vnode = {
    type: 'div',
    props: {
      onClick: () => {
        alert('父元素 clicked')
      }
    },
    children: '父元素',
  }
  renderer(vnode, document.getElementById('app'))