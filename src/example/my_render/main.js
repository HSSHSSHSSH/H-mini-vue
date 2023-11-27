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

import { 
  MyComponent,
  MySetupComponent1,
  MySetupComponent2
} from './component/my_component.js'

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


let num = ref(1)
const CompVNode = {
  type: MySetupComponent2,
  props: {
    num: num,
    onClick: () => {
      num.value++
      console.log('被点击')
    },
    onChange: (payload) => {
      console.log('我在 props 中创建了一个 emit!!!')
    }
  }
}


renderer(CompVNode, document.getElementById('app'))
