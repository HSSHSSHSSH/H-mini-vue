// mini-vue的出口

export * from './runtime-dom'

import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'
import {registerRuntimeCompiler} from './runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function("Vue", code)(runtimeDom)
  return render

  // function renderFunction(Vue) {
  //   const {
  //     toDisplayString: _toDisplayString,
  //     openBlock: _openBlock,
  //     createElementBlock: _createElementBlock,
  //   } = Vue

  //   function render(_ctx, _cache) {
  //     return (
  //       _openBlock(),
  //       _createElementBlock(
  //         'div',
  //         null,
  //         'hi, ' + _toDisplayString(_ctx.message),
  //       )
  //     )
  //   }
  // }
}


registerRuntimeCompiler(compileToFunction)
