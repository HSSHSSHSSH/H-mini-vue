import { h } from '../../../lib/guide-mini-vue.esm.js'
import {foo} from './foo.js'
export const App = {
  render() {
    return h(
      'div',
      {
        onClick() {
          console.log('蛙叫你点我')
        },
      },
      [h('h1', {}, 'Hello World'), h(foo, {count: 1})],
    )
    // return h("h1", {}, 'Hello World ' + this.msg)
  },
  setup() {
    return {
      msg: 'mini-vue',
    }
  },
}
