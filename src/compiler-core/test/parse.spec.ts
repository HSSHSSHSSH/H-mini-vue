import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'

describe('Parse', () => {

  // 解析插值公式
  describe('interpolation', () => {
    test('simple interpolation', () => {
      const ast = baseParse('{{ message }}')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message',
        },
      })
    })
  })

  // 解析 element 标签
  describe('element', () => {
    it('simple element div', () => {
      const ast = baseParse('<div></div>')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
      })
    })
  })

  // 解析 text 文本

  describe('text', () => {
    it('simple text', () => {
      const ast = baseParse('some text')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text',
      })
    })
  })
})
