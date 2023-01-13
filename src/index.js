/**
 * 新一代版本
 * @author yutent<yutent.io@gmail.com>
 * @date 2020/07/31 18:59:47
 */

import nativeFetch from 'node-fetch'
import { Format, toS } from './lib/format.js'

const NOBODY_METHODS = ['GET', 'HEAD']
const FORM_TYPES = {
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  text: 'text/plain; charset=UTF-8'
}
const ERRORS = {
  10001: 'Argument url is required',
  10012: 'Parse error',
  10100: 'Request canceled',
  10104: 'Request pending...',
  10200: 'Ok',
  10204: 'No content',
  10304: 'Not modified',
  10500: 'Internal Server Error',
  10504: 'Connected timeout'
}

class _Request {
  constructor(url = '', options = {}, owner) {
    if (!url) {
      throw new Error(ERRORS[10001])
    }

    // url规范化
    url = url.replace(/#.*$/, '')

    if (owner.BASE_URL) {
      if (!/^([a-z]+:|\/\/)/.test(url)) {
        url = owner.BASE_URL + url
      }
    }

    options.method = (options.method || 'get').toUpperCase()

    this._owner = owner

    this.options = {
      headers: {
        'content-type': FORM_TYPES.form
      },
      body: null,
      cache: 'default',
      signal: null, // 超时信号, 配置该项时, timeout不再生效
      timeout: 30000 // 超时时间, 单位毫秒, 默认30秒
    }

    if (!options.signal) {
      this.control = new AbortController()
      options.signal = this.control.signal
    }

    if (options.headers) {
      let headers = this.options.headers
      Object.assign(headers, options.headers)
      options.headers = headers
    }

    Object.assign(this.options, options, { url })

    if (owner._inject_req) {
      owner._inject_req(this.options)
    }

    return this.__next__()
  }

  __next__() {
    var options = this.options
    var hasAttach = false // 是否有附件
    var noBody = NOBODY_METHODS.includes(options.method)

    /* --------------------------  1»» 请求的内容 --------------------- */
    if (options.body) {
      var type = typeof options.body
      switch (type) {
        case 'number':
        case 'string':
          this.__type__('text')
          break
        case 'object':
          // 如果是一个 FormData对象,且为不允许携带body的方法,则直接改为POST
          if (options.body.constructor === FormData) {
            hasAttach = true
            // 修正请求类型
            if (noBody) {
              options.method = 'POST'
            }
          } else {
            for (let k in options.body) {
              if (toS.call(options.body[k]) === '[object File]') {
                hasAttach = true
                break
              }
            }
            // 有附件,则改为FormData
            if (hasAttach) {
              if (noBody) {
                options.method = 'POST'
              }
              options.body = Format.mkFormData(options.body)
            }
          }
          break
      }
    }
    if (hasAttach) {
      delete options.headers['content-type']
    }

    /* --------------------------  2»» 处理跨域  --------------------- */

    /* ------------- 3»» 根据method类型, 处理表单数据  ---------------- */

    // 拼接到url上
    if (noBody) {
      let tmp = Format.param(options.body)
      if (tmp) {
        options.url += (~options.url.indexOf('?') ? '&' : '?') + tmp
      }
      delete options.body
    } else {
      if (!hasAttach) {
        if (~options.headers['content-type'].indexOf('json')) {
          options.body = JSON.stringify(options.body)
        } else {
          options.body = Format.param(options.body)
        }
      }
    }

    /* -----------------   4»» 超时处理  -----------------------*/
    if (options.timeout && options.timeout > 0) {
      this.timer = setTimeout(_ => {
        this.abort()
      }, options.timeout)

      delete options.timeout
    }

    /* -----------------    5»» 构造请求    ------------------- */
    var url = options.url
    delete options.url
    for (let k in options) {
      if (
        options[k] === null ||
        options[k] === undefined ||
        options[k] === ''
      ) {
        delete options[k]
      }
    }
    return nativeFetch(url, options)
      .then(r => {
        clearTimeout(this.timer)
        let isSucc = r.status >= 200 && r.status < 400
        let _type
        if (this._owner._inject_res) {
          r = this._owner._inject_res(r)
          _type = toS.call(r)
        }
        if (isSucc) {
          return r
        } else {
          if (_type === '[object Promise]') {
            return r.then(_ => Promise.reject(_))
          } else {
            return Promise.reject(r)
          }
        }
      })
      .catch(e => {
        clearTimeout(this.timer)
        return Promise.reject(e)
      })
  }

  abort() {
    this.control.abort()
  }

  __type__(type) {
    this.options.headers['content-type'] = FORM_TYPES[type]
  }
}

function inject(target) {
  target.inject = {
    request(callback) {
      target._inject_req = callback
    },
    response(callback) {
      target._inject_res = callback
    }
  }
}

const fetch = function (url, options) {
  return new _Request(url, options, fetch)
}

fetch.create = function () {
  var another = function (url, options) {
    return new _Request(url, options, another)
  }
  inject(another)
  return another
}

inject(fetch)

export default fetch
