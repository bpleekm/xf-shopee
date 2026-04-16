# 项目概述
这是一个百货超市的ERP系统，超市管理员可以通过web后台增加删除员工，员工可以通过web后台或者移动端app对sku进行增删查改，员工可以将sku加入购物车，修改单项的单价，提交订单，推进订单状态。游客可以通过web端访问超市sku列表，将sku加入购物车，提交订单。

# 项目架构

1. 后端架构，后端使用nginx作为反向代理，使用nodejs运行服务，使用exporess作为请求框架，使用pm2作为node服务管理器
2. 使用mysql作为服务器数据存储数据库
3. 前端架构不限，但是api需要有统一的定义，使用中间代码定义或者直接共享相同的请求model代码均可
4. 移动端使用hybird架构，native提供存储、cookie注入等功能，整体以一个webview方式实现，通过native管理多个webview实现不同模块页面按需加载隔离

# 工作空间规范

## 项目结构
所有项目文件应位于仓库根目录下，采用扁平化结构组织，避免多层嵌套目录。

### 推荐目录结构
```
xf-shopee/
├── backend/           # 后端服务代码
│   ├── src/          # 源代码
│   ├── package.json
│   └── ...
├── frontend/         # Web前端代码
│   ├── web-admin/    # 后台管理系统
│   ├── web-front/    # 前台购物网站
│   └── ...
├── mobile/           # 移动端应用代码
├── docs/             # 项目文档（包括本设计文档）
│   └── modules/      # 模块详细设计
├── scripts/          # 构建、部署脚本
├── config/           # 配置文件
├── README.md
└── PROJECT.md
```

### 原则
- **根目录集中管理**：所有主要项目代码直接置于根目录下的一级子目录中
- **模块化组织**：按照功能模块划分目录，如 backend、frontend、mobile 等
- **文档统一存放**：设计文档、API文档等统一放在 docs/ 目录下
- **配置分离**：环境配置、构建配置等独立存放于 config/ 目录
- **避免深层嵌套**：目录层级不超过3级，提高代码可访问性

# 代码风格与开发规范

## 设计文档规范
每个模块、页面和组件目录必须包含设计规范文档：

### 1. 模块根目录
- `DESIGN.md`: 模块整体架构、目录结构、代码规范
- 位置: `backend/DESIGN.md`, `frontend/web-admin/DESIGN.md`, `frontend/web-front/DESIGN.md`, `mobile/DESIGN.md`

### 2. 页面目录
- `DESIGN.md`: 页面设计原则、状态管理、路由设计、数据获取策略
- 位置: `frontend/web-front/src/views/DESIGN.md`

### 3. 组件目录
- `DESIGN.md`: 组件设计原则、Props设计、事件设计、样式规范
- 位置: `frontend/web-front/src/components/DESIGN.md`

### 4. 状态管理目录
- `DESIGN.md`: 状态管理原则、Store设计、持久化策略、错误处理
- 位置: `frontend/web-front/src/stores/DESIGN.md`

## 代码风格统一要求

### 1. 命名规范
- **文件命名**: 使用连字符分隔的小写字母（后端）或帕斯卡命名法（前端）
- **变量/函数**: 使用驼峰命名法
- **常量**: 使用大写字母和下划线分隔
- **类名**: 使用帕斯卡命名法

### 2. 目录结构规范
```
[模块]/
├── src/
│   ├── [功能分类]/     # 按功能组织代码
│   ├── utils/          # 工具函数
│   ├── constants/      # 常量定义
│   └── DESIGN.md       # 设计规范
├── tests/              # 测试文件
├── package.json        # 依赖配置
└── README.md           # 使用说明
```

### 3. 文档要求
- 所有公共API必须有文档注释
- 复杂业务逻辑必须有代码注释
- 设计决策必须有文档记录
- 更新代码必须同步更新文档

### 4. 测试规范
- 单元测试覆盖率不低于70%
- 集成测试覆盖核心业务流程
- 测试文件与源码文件同名，后缀为 `.test.js` 或 `.spec.js`
- 测试数据使用工厂函数生成

### 5. 提交规范
- 使用Conventional Commits规范
- 提交信息格式: `type(scope): description`
- 类型包括: feat, fix, docs, style, refactor, test, chore
- 关联issue编号

### 6. 代码审查规范
- 至少需要一名代码审查者
- 审查重点: 代码质量、安全性、性能、可维护性
- 使用PR模板确保审查完整性

### 7. 安全规范
- 输入验证和清理
- 防止SQL注入和XSS攻击
- 敏感信息加密存储
- 权限验证和访问控制

### 8. 性能规范
- 数据库查询优化
- 前端资源懒加载
- 缓存策略实施
- 内存泄漏预防

## 技术栈特定规范

### 后端 (Node.js + Express)
- 使用ES6+语法
- 错误处理使用async/await配合try-catch
- 数据库操作使用ORM（Sequelize）
- API响应统一格式

### 前端 (React/Vue)
- 使用函数式组件和Hooks
- 状态管理使用Redux/Pinia
- 样式使用CSS Modules或Styled Components
- 组件按功能分类组织

### 移动端 (React Native Hybrid)
- WebView与原生模块分离
- 桥接通信使用JSON格式
- 模块隔离设计
- 性能监控和优化

## 开发工作流
1. **需求分析**: 编写设计文档和API文档
2. **本地开发**: 遵循设计规范编写代码
3. **代码审查**: 提交PR进行代码审查
4. **测试验证**: 通过自动化测试
5. **部署发布**: 使用CI/CD流水线部署

## 质量保证
- 代码静态分析（ESLint、Prettier）
- 自动化测试（单元测试、集成测试、E2E测试）
- 性能监控（APM工具）
- 错误监控（Sentry）

## 变更管理
- 重大变更需要设计文档评审
- API变更需要版本管理和向后兼容
- 数据库变更需要迁移脚本
- 配置变更需要环境隔离

---
*设计规范文件需随项目演进持续更新，确保与实际代码保持一致。*

