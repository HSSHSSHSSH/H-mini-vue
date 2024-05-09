import { h } from '../../../lib/guide-mini-vue.esm.js'

import ArrayToText from './ArrayToText.js'
import TextToText from './TextToText.js'
import TextToArray from './TextToArray.js'
import ArrayToArray from './ArrayToArray.js'


export const App = {
  name: 'App',
  setup() {
    return {}
  },
  render() {
    return h("div", {tID: 1}, [
      h("p", {}, "主页"),
      // h(ArrayToText),
      // h(TextToText)
      // h(TextToArray),
      h(ArrayToArray)
    ])
  }
}