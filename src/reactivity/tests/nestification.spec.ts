import { reactive } from '../reactive'
import { effect } from '../effect'


describe('nestification', () => {
  it('happy path', () => {
    const obj = reactive({
      foo: '000',
      bar: '111'
    })

    let temp1, temp2
    let outer_called_times = 0
    let inner_called_times = 0

    effect(() => {
      outer_called_times++
      effect(() => {
        inner_called_times++
        temp2 = obj.bar
      })
      temp1 = obj.foo
    })

    expect(temp1).toBe('000')
    expect(temp2).toBe('111')
    expect(outer_called_times).toBe(1)
    expect(inner_called_times).toBe(1)

    obj.bar = '333'

    expect(temp1).toBe('000')
    expect(temp2).toBe('333')
    expect(outer_called_times).toBe(1)
    expect(inner_called_times).toBe(2)

    obj.foo = '444'

    expect(temp1).toBe('444')
    expect(temp2).toBe('333')
    expect(outer_called_times).toBe(2)
    expect(inner_called_times).toBe(3)

    obj.foo = '555'
    expect(temp1).toBe('555')
    expect(temp2).toBe('333')
    expect(outer_called_times).toBe(3)
    expect(inner_called_times).toBe(4)
    
    obj.bar = '666'
    expect(temp1).toBe('555')
    expect(temp2).toBe('666')
    expect(outer_called_times).toBe(3)
    expect(inner_called_times).toBe(5)

  })
})