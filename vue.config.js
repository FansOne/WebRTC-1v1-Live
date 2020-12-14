module.exports = {
    filenameHashing:false,
    lintOnSave:false,
    publicPath: process.env.NODE_ENV==='production'?'https://static.xuefu.com/xfwx/static/1v1':'/',
    devServer: {
        overlay: { // 让浏览器 overlay 同时显示警告和错误
            warnings: true,
            errors: true
        },
        disableHostCheck: true,
        open: true,
        port: "8080",
        https: false,
        hotOnly: false,
        proxy: {
            "/api": {
                target: "http://sit-wx.xuefu.com/api",
                secure: true,
                changeOrigin: true,
                pathRewrite: {
                    "^/api": ""
                }
            }
        }
    },

    // 适配
    chainWebpack: config => {
        config.module
            .rule('less','css')

            .oneOf('vue')

            .use('px2rem-loader')

            .loader('px2rem-loader')

            .before('postcss-loader')

            .options({
                remUnit: 192, //代表的是 1rem = ？px  设计稿是 1920px ，那么这里的比例就是 1/10
                remPrecision: 8
            })
            .end()
    },

    // 配置通过script标签引入的第三方包
    configureWebpack:{
        externals: {
            'TIC':'TIC',
            'webim':'webim',
            'TEduBoard':'TEduBoard',
            'COS':'COS',
        }
    }
};