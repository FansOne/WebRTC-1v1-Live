import http from '../http'

export function livieStart (params){
    return http.get('/css/live/start',params)
}

export function livieStop (params){
    return http.get('/css/live/stop',params)
}
