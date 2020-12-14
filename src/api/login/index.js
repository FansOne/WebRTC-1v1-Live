import http from '../http'

// 教师/线下学生登录获取TOKEN
export function login (params){
    return http.post('/login/live/login',params)
}

export function getUserInfo (params){
    return http.get('/css/live/userinfo',params)
}
