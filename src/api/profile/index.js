import http from '../http'

export function setRole (params){
    //设置教师role
    return http.put('/css/live/im/role',params)
}