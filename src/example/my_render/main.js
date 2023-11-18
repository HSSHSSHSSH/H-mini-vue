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

import { MyComponent } from './component/my_component.js'

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



const CompVNode = {
  type: MyComponent,
  props: {
    title: '蛙叫你 title',
    other: 'other',
  }
}


renderer(CompVNode, document.getElementById('app'))
