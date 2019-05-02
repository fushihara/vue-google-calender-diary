module.exports = {
  css: {
    extract: false,
  },
  filenameHashing: false,
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
    devtool: "cheap-module-source-map", // vue-cli-service build --mode development で出力したjsでeval("ソースコード")の部分を無くす時はon
  },
  pages: {
    index: {
      //entry: "src/main.ts",
      entry: "src/index.ts",
      //template: "src/index.html",
      filename: "index.html",
    }
  },
  filenameHashing: true,
  publicPath: process.env.PUBLIC_PATH || "/", // 通常は「/」
  outputDir: "build-result"
}