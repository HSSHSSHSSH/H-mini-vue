import { reactive } from '../reactive'
import { effect } from '../effect'

describe('cleanup', () => {
  it('happy path', () => {
    // 每次执行副作用函数时，将其从与之有关的依赖项中删除
    const data = { ok: true, text: 'hello world' }
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
    obj.ok = 0
    expect(fn).toHaveBeenCalledTimes(3)
    obj.text = 'hello world 3'
    expect(fn).toHaveBeenCalledTimes(3)
    obj.ok = true
    expect(text).toBe('hello world 3')
    expect(fn).toHaveBeenCalledTimes(4)
    obj.text = 'hello world 4'
    expect(text).toBe('hello world 4')
    expect(fn).toHaveBeenCalledTimes(5)
  })
})
