
import {h} from '../../../lib/guide-mini-vue.esm.js'
export const App = {
  render() {
    return h("div", {},[
      h("h1", {}, 'Hello World'),
      h("h1", {}, 'Hello World'),
    ])
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}