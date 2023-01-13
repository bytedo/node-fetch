/**
 *
 * @authors yutent (yutent.io@gmail.com)
 * @date    2016-11-26 16:35:45
 *
 */

export const toS = Object.prototype.toString
export const encode = encodeURIComponent
export const decode = decodeURIComponent

/**
 * 表单序列化
 */
function serialize(p, obj, query) {
  var k
  if (Array.isArray(obj)) {
    obj.forEach(function (it, i) {
      k = p ? `${p}[${Array.isArray(it) ? i : ''}]` : i
      if (typeof it === 'object') {
        serialize(k, it, query)
      } else {
        query(k, it)
      }
    })
  } else {
    for (let i in obj) {
      k = p ? `${p}[${i}]` : i
      if (typeof obj[i] === 'object') {
        serialize(k, obj[i], query)
      } else {
        query(k, obj[i])
      }
    }
  }
}

export const Format = {
  mkFormData(data) {
    let form = new FormData()
    for (let i in data) {
      let el = data[i]
      if (Array.isArray(el)) {
        el.forEach(function (it) {
          form.append(i + '[]', it)
        })
      } else {
        form.append(i, data[i])
      }
    }
    return form
  },
  param(obj) {
    if (!obj || typeof obj === 'string' || typeof obj === 'number') {
      return obj
    }

    let arr = []
    let query = function (k, v) {
      if (/native code/.test(v)) {
        return
      }

      v = typeof v === 'function' ? v() : v
      v = toS.call(v) === '[object File]' ? v : encode(v)

      arr.push(encode(k) + '=' + v)
    }

    if (typeof obj === 'object') {
      serialize('', obj, query)
    }

    return arr.join('&')
  }
}
