
import {h} from '../../../lib/guide-mini-vue.esm.js'
window.self = null
export const App = {
  render() {
    window.self = this
    return h("div", {
      onClick() {
        console.log('蛙叫你点我')
      }
    },[
      h("h1", {}, 'Hello World'),
      h("h1", {}, 'Hello World'),
    ])
    // return h("h1", {}, 'Hello World ' + this.msg)
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}