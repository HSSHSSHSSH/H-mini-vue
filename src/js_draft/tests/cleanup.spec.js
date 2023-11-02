const {reactive} = require('../reactivity/reactive')
const {effect} = require('../reactivity/effect')

describe('cleanup', () => {
  it("happy path", () => {
    const data = {ok: true, text: 'hello world'}
    const obj = reactive(data)

    let text = '蛙叫你'


    let fn = jest.fn(() => {
      text = obj.ok ? obj.text : 'not'
    })

    effect(fn)

    expect(text).toBe('hello world')
    expect(fn).toHaveBeenCalledTimes(1)
    obj.ok = false
    expect(text).toBe('not')
    expect(fn).toHaveBeenCalledTimes(2)
    obj.text = 'hello world 2'
    expect(text).toBe('not')
    expect(fn).toHaveBeenCalledTimes(2)

  })
})