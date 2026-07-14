世界杯赛事信息与互动预测平台
================================

一、GitHub 仓库地址
------------------
https://github.com/Daily-6/web


二、技术栈
----------
前端: Next.js 16 + React 19 + TailwindCSS 4, App Router, TSX
后端: Midway.js 4 + Koa + SQLite (node:sqlite), RESTful API
契约: OpenAPI 3.1 (contracts/openapi.yaml)
Agent: MCP Server (agent/index.mjs)


三、本地启动方式
----------------
npm install
npm run dev

前端: http://localhost:3000
后端: http://localhost:7001


四、Docker Compose 启动方式
----------------------------
docker compose -f infra/compose.yaml up

前端: http://localhost:3000
后端: http://localhost:7001


五、数据库和资源文件挂载说明
------------------------------
- 种子数据: backend/data/teams.json, games.json, stadiums.json, groups.json
- SQLite 数据库: backend/data/course-demo.sqlite（首次启动自动创建）
- Docker 中数据库挂载于 volume course-data，路径 /app/backend/data/


六、功能清单
------------
[x] 赛程浏览（按小组筛选，104场比赛）
[x] 球队信息（48支球队，分组展示，中文队名）
[x] 积分榜/淘汰赛图（12组积分榜，淘汰赛对阵图）
[x] 比分预测（同一用户同一比赛唯一预测，开赛后禁止修改）
[x] 比赛结果录入
[x] 用户收藏
[x] 评论互动
[x] 四态覆盖（加载/空/错误/成功）
[x] 并发控制（UNIQUE约束 + 状态检查）
[x] Agent MCP Server 接入
[x] Docker Compose 一键部署


七、额外实现功能介绍
--------------------
- 从 worldcup26.ir 获取2026世界杯真实数据作为种子数据
- 48支球队中文名翻译
- 104场比赛含小组赛+淘汰赛完整赛程
- 16座球场信息
- 首页最新比赛展示
- 赛程按小组/状态筛选
- 比赛详情页（预测+评论+收藏）