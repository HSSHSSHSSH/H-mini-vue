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
        children: [],
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

  test('hello world', () => {
    const ast = baseParse('<div>hi,{{message}}</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hi,',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })

  test('nested element', () => {
    const ast = baseParse('<div><p>hi</p>{{message}}</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'hi'
            }
          ]
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })


  test('should throw error when lack the end tag ', () => {
    expect(() => {
      baseParse('<div><span></div')
    }).toThrow('缺少结束标签：span')
  })
})
