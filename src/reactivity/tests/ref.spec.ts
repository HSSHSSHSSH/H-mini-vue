import { effect } from "../effect"
import { isRef, proxyRefs, ref, unRef } from "../ref"



describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  })
  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(dummy).toBe(1)
    expect(calls).toBe(1)
    a.value = 2
    expect(dummy).toBe(2)
    expect(calls).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(dummy).toBe(2)
    expect(calls).toBe(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    })

    let dummy 

    effect(() => {
      dummy = a.value.count
    })

    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)

  })

  it('isRef', () => {
    const a = 1
    const ref_a = ref(a)
    const original = { foo: 1 }
    const ref_original = ref(original)

    expect(isRef(a)).toBe(false)
    expect(isRef(ref_a)).toBe(true)
    expect(isRef(original)).toBe(false)
    expect(isRef(ref_original)).toBe(true)

  })

  it('unRef', () => {
    const a = 1
    const ref_a = ref(a)
    expect(unRef(a)).toBe(1)
    expect(unRef(ref_a)).toBe(1)
  })

  it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: '蛙叫你'
    }
    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('蛙叫你')
    
    // 修改proxyUser的值，user也会变化
    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(30)
    expect(proxyUser.age).toBe(30)
    expect(user.age.value).toBe(30)

  })

})