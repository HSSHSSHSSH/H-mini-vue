import { reactive } from '../reactive'
import {watch} from '../watch'



describe('watch', () => {
  it('happy path', () => {
    const obj = reactive({
      foo:1
    })

    const fn = jest.fn(() => {
      return obj.foo
    })

    watch(obj, fn)

    expect(fn).toHaveBeenCalledTimes(0)
    obj.foo = 2
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('receive getter', () => {
    const obj = reactive({
      foo: 1
    })

    const fn = jest.fn()

    watch(
      () => obj.foo,
      fn
    )

    expect(fn).toHaveBeenCalledTimes(0)
    obj.foo++
    expect(fn).toHaveBeenCalledTimes(1)

  })

  it('get newVal and oldVal', () => {
    const obj = reactive({
      foo: 1
    })

    let dummy
    watch(
      () => obj.foo,
      (newVal, oldVal) => {
        dummy = [newVal, oldVal]
      }
    )

    obj.foo++
    expect(dummy).toEqual([2, 1])
  })

  it('immediate', () => {
    const obj = reactive({
      foo: 1
    })

    let dummy
    const fn = jest.fn((newVal, oldVal) => {
      dummy = [newVal, oldVal]
    },)
    watch(
      () => obj.foo,
      fn,
      { immediate: true }
    )
    expect(fn).toHaveBeenCalledTimes(1)
    expect(dummy).toEqual([1, undefined])
  })

})