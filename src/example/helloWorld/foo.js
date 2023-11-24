
import { h } from '../../../lib/guide-mini-vue.esm.js'


export const foo = {
  setup (props) {
    console.log('foo setup props', props)
    props.count++
    return {

    }
  },
  render() {
    return h('div', {}, 'foo: ' + this.count)
  }
}