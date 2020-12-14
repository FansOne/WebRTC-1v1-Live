import axios from 'axios'
import { Message } from 'element-ui'

const http = axios.create({
  baseURL: process.env.NODE_ENV==='production' ? SITE_CONFIG['BASE_URL'] : '/api',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  timeout: 30000                              
})

var TOKEN = JSON.parse(sessionStorage.getItem('SITE_CONFIG'))!=null ? JSON.parse(sessionStorage.getItem('SITE_CONFIG')).TOKEN : '';

http.interceptors.request.use(config => {
  config.headers['token'] =  SITE_CONFIG['TOKEN'] || TOKEN || ''
  return config
}, error => {
  Promise.reject(error)
})

http.interceptors.response.use(response => {
    if (response.data.code != 0) {
      Message.error(`ERROR：${response.data.msg}`);
      return Promise.reject(response)
    }
    return Promise.resolve(response.data.data)
  },error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.log(401)
          break;
        case 403:
          console.log(403)
          break;
        case 404:
          console.log(404)
          break;
        case 500:
          console.log(500)
          break;
      }
    }
    Message.error(`请求失败，服务器响应错误！`);
    return Promise.reject(error.response)
  }
)

function get(url, params = {}) {
  return http({
    url,
    method: 'GET',
    params
  })
}

function post(url, data = {}) {
  return http({
    url,
    method: 'POST',
    data
  })
}

function put(url, data = {}) {
  return http({
    url,
    method: 'PUT',
    data
  })
}

function delete_(url, data = {}) {
  return http({
    url,
    method: 'DELETE',
    data
  })
}
export default {
  get, post,put,delete_
}