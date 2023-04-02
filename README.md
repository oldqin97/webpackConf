# webpack 应用

### 1 - 理解 `webpack` 配置逻辑

`webpack` 打包过程非常复杂,但是可以简化为

- 输入：从文件系统读入代码文件；
- 模块递归处理：调用 Loader 转译 Module 内容，并将结果转换为 AST，从中分析出模块依赖关系，进一步递归调用模块处理过程，直到所有依赖文件都处理完毕；
- 后处理：所有模块递归处理完毕后开始执行后处理，包括模块合并、注入运行时、产物优化等，最终输出 Chunk 集合；
- 输出：将 Chunk 写出到外部文件系统；

`webpack` 配置项目大体可分为两类

- **流程类**: 作用于打包流程某个或若干个环节，直接影响编译打包效果的配置项
- **工具类** ：打包主流程之外，提供更多工程化工具的配置项

> **流程类配置**

与打包流程强相关的配置项有：

- 输入输出
  - `entry`: 用于定义入口文件, Webpack 会从这些入口文件开始按图索骥找出所有项目文件
  - `context`: 项目执行上下文路径
  - `output`: 配置产物输出路径、名称等
- 模块处理:
  - `resolve`: 用于配置模块路径解析规则, 可用于帮助 Webpack 更精确、高效地找到指定模块
  - `module`: 用于配置模块加载规则, 例如针对什么类型的资源需要使用哪些 Loader 进行处理
  - `externals`: 用于声明外表资源, Webpack 会直接忽略这部分资源,跳过这些资源进行解析、打包操作
- 后处理:
  - `optimization`: 用于控制如何优化产物包体积、内置 Dead Code Elimination、Scope Hoisting、代码混淆、代码压缩
  - `target`: 用于配置编译产物的目标运行环境、支持 web、node、electron 等值,不同值最终产物会有所差异
  - `mode`: 编译模式短语, 支持 `development`, `production`

Webpack **首先** 需要根据输入配置(entry/context) 找到项目入口文件；**之后** 根据按模块处理(module/resolve/externals 等) 所配置的规则逐一处理模块文件，处理过程包括转译、依赖分析等；模块处理完毕后，**最后** 再根据后处理相关配置项(optimization/target 等)合并模块资源、注入运行时依赖、优化产物结构等。

> 工具类配置项综述

除了核心的打包功能之外，Webpack 还提供了一系列用于提升研发效率的工具，大体上可划分为：

- 开发效率类：
  - watch：用于配置持续监听文件变化，持续构建
  - devtool：用于配置产物 Sourcemap 生成规则
  - devServer：用于配置与 HMR 强相关的开发服务器功能
- 性能优化类：
  - cache：Webpack 5 之后，该项用于控制如何缓存编译过程信息与编译结果
  - performance：用于配置当产物大小超过阈值时，如何通知开发者
- 日志类：
  - stats：用于精确地控制编译过程的日志内容，在做比较细致的性能调试时非常有用
  - infrastructureLogging：用于控制日志输出方式，例如可以通过该配置将日志输出到磁盘文件

逻辑上，每一个工具类配置都在主流程之外提供额外的工程化能力，例如 devtool 用于配置产物 Sourcemap 生成规则，与 Sourcemap 强相关；devServer 用于配置与 HMR 相关的开发服务器功能；watch 用于实现持续监听、构建。

```
 ╭──────────────────────────────────────────────────────────╮
 │ 文件目录结构                                             │
 ╰──────────────────────────────────────────────────────────╯
├── README.md
├── assets
├── file-list.txt
├── package.json
├── src
│   └── index.js
└── webpack.config.js
```

其中, `src/index.js` 作为项目的入口文件, `webpack.config.js` 为 Webpack 配置文件. 在配置文件中, 首先我们需要声明项目入口:

```js
 ╭──────────────────────────────────────────────────────────╮
 │ webpack.config.js                                        │
 ╰──────────────────────────────────────────────────────────╯
module.exports = {
  entry: './src/index.js',
};
```

有了入口, 我们还需要什么产物 `输出路径`:

```js
 ╭──────────────────────────────────────────────────────────╮
 │ webpack.config.js                                        │
 ╰──────────────────────────────────────────────────────────╯
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './dist'),
  },
};
```

### 借助 babel + TS + Eslint 构建现代 js 工程环境

##### 使用 babel

Babel 是一个开源 JavaScript 转编译器，它能将高版本 —— 如 ES6 代码等价转译为向后兼容，能直接在旧版 JavaScript 引擎运行的低版本代码，例如：

```js
 ╭──────────────────────────────────────────────────────────╮
 │ 使用 Babel 转译前                                        │
 ╰──────────────────────────────────────────────────────────╯
arr.map(item => item + 1);

 ╭──────────────────────────────────────────────────────────╮
 │ 转译后                                                   │
 ╰──────────────────────────────────────────────────────────╯
arr.map(function (item) {
  return item + 1;
});
```

高版本的箭头函数语法经过 Babel 处理后被转译为低版本 `function` 语法，从而能在不支持箭头函数的 JavaScript 引擎中正确执行。借助 Babel 我们既可以始终使用最新版本 ECMAScript 语法编写 Web 应用，又能确保产物在各种环境下正常运行。

> Webpack 场景下，只需使用 babel-loader 即可接入 Babel 转译功能：

1. 安装依赖

```shell
npm i -D webpack webpack-cli
npm i -D @babel/core @babel/preset-env babel-loader
```

2. 添加模块处理规则

```js
module.exports = {
  /* ... */
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
      },
    ],
  },
};
```

示例中，`module` 属性用于声明模块处理规则，`module.rules` 子属性则用于定义针对什么类型的文件使用哪些 Loader 处理器，上例可解读为：

- `test: /\.js$/`: 用于声明该规则的过滤条件, 只有路径名命中该正则的文件才会应用到这条规则 (表示对所有.js 后缀的文件生效)
- `use`: 用于声明这条规则的 Loader 处理器序列, 所有命中该规则的文件都会被传入 Loader 序列做转译处理

抽出配置到 配置文件中 `babel.config.js`

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            // options: {
            //   presets: ['@babel/preset-env'],
            // },
          },
        ],
      },
    ],
  },
};
```

3. 执行编译命令

```shell
npx webpack
```

示例中的 @babel/preset-env 是一种 Babel 预设规则集 —— Preset，这种设计能按需将一系列复杂、数量庞大的配置、插件、Polyfill 等打包成一个单一的资源包，从而简化 Babel 的应用、学习成本。Preset 是 Babel 的主要应用方式之一，社区已经针对不同应用场景打包了各种 Preset 资源

- [`babel-preset-react`](https://link.juejin.cn/?target=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fbabel-preset-react)：包含 React 常用插件的规则集，支持 `preset-flow`、`syntax-jsx`、`transform-react-jsx` 等；
- [`@babel/preset-typescript`](https://link.juejin.cn/?target=https%3A%2F%2Fbabeljs.io%2Fdocs%2Fen%2Fbabel-preset-typescript)：用于转译 TypeScript 代码的规则集
- [`@babel/preset-flow`](https://link.juejin.cn/?target=https%3A%2F%2Fbabeljs.io%2Fdocs%2Fen%2Fbabel-preset-flow%2F)：用于转译 [Flow](https://link.juejin.cn/?target=https%3A%2F%2Fflow.org%2Fen%2Fdocs%2Fgetting-started%2F) 代码的规则集
