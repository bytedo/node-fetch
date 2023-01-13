## node-fetch的增强版
> node-fetch的增强版, 增加注入及数据处理, 支持多实例。


## Node.js 兼容性

因为需要支持 ESM。所以需要 Node.js >= v12.0.0,  



### 示例

```js
import fetch from '@bytedo/node-fetch'


fetch('/get_list', {body: {page: 1}})
  .then(r => r.json())
  .then(list => {
    console.log(list)
  })


// 创建一个新的fetch实例, 可传入新的基础域名, 和公共参数等
var f1 = fetch.create('//192.168.1.101', {headers: {token: 123456}})

f1('/get_list', {body: {page: 1}})
  .then(r => r.json())
  .then(list => {
    console.log(list)
  })


```



### APIs

#### 1. fetch(url[, options<Object>])
> 发起一个网络请求, options的参数如下。 同时支持配置公共域名, 公共参数。

  + method`<String>` 默认GET, 可选GET/POST/PUT/DELETE...
  + body`<Any>` 要发送的数据, 如果是不允许有`body`的方式, 会被自动拼接到url上
  + cache`<String>`  是否缓存, 
  + credentials`<String/Boolean>` 是否校验
  + signal`<Object>`  网络控制信号, 可用于中断请求
  + timeout`<Number>`  超时时间, 默认30秒, 单位毫秒


```js
fetch.BASE_URL = '//192.168.1.100'
// 1.2.0开始支持注入
fetch.inject.request(function(conf) {
  // 无需返回值, 但需要注意这是引用类型,不要对带个conf赋值
  conf.headers.token = 123456
})

// 响应注入, 需要有返回值
fetch.inject.response(function(res) {
  return res.json()
})
```


#### 2. fetch.create()
> 创建一个新的fetch实例, 可以无限创建多个实例(用于同一个项目中有多组不同的接口)。

```js
var another = fetch.create()
another.BASE_URL = '//192.168.1.101'
// 新创建的实例, 也支持注入
another.inject.request(function(conf) {
  conf.headers.token = 123456
})

another.inject.response(function(res) {
  return res.json()
})

```


