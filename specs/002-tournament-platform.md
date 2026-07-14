# 002-tournament-platform

## 目标

构建世界杯赛事信息与互动预测平台，提供赛程浏览、球队信息、积分榜、比分预测、比赛结果录入、用户收藏和评论互动功能。

## 用户故事

作为足球迷，我希望能够：

1. 浏览赛程安排和球队信息
2. 查看小组积分榜
3. 对即将开始的比赛进行比分预测
4. 查看已结束比赛的结果
5. 收藏我关注的比赛
6. 在比赛页面发表评论互动

## 范围

- 16支球队，4个小组
- 10场预设比赛（含小组赛已结束和未开始的比赛）
- 3个预设用户
- 比分预测（同一用户同一比赛唯一预测，开赛后禁止修改）
- 评论互动
- 收藏功能

## 非范围

- 用户认证/注册系统
- 实时比分推送
- 淘汰赛阶段管理
- 管理员后台
- 邮件通知

## 业务规则

- 同一用户对同一场比赛只能保留一条有效比分预测
- 并发提交不得产生重复记录（UNIQUE约束）
- 开赛后禁止修改预测
- 积分榜按积分>净胜球>进球数排序

## 契约影响

- 新增 API: /api/teams, /api/matches, /api/standings, /api/predictions, /api/comments, /api/favorites
- 更新 contracts/openapi.yaml 包含所有新增接口

## 验收标准

### AC-T01: 球队列表

- GET /api/teams 返回所有球队，按分组排列
- 前端展示分组球队卡片，支持加载/空/错误/成功四态

### AC-M01: 赛程浏览

- GET /api/matches 支持按状态筛选
- 前端展示比赛列表，支持状态切换过滤

### AC-M02: 比赛结果录入

- POST /api/matches/:id/result 录入比分
- 接受非负整数，拒绝无效输入（400）

### AC-S01: 积分榜

- GET /api/standings 返回分组积分榜
- 已结束比赛自动更新积分

### AC-P01: 预测查询

- GET /api/predictions 支持按用户/比赛查询
- 无预测时返回null

### AC-P02: 预测提交

- POST /api/predictions 创建或更新预测
- 比赛已开始时返回400错误

### AC-P03: 并发预测唯一性

- 同一用户同一比赛在并发场景下仅产生一条记录
- UNIQUE(user_id, match_id)约束保证

### AC-C01: 评论列表

- GET /api/comments?matchId= 返回评论列表
- 包含用户名信息

### AC-C02: 评论发表

- POST /api/comments 创建评论
- 内容不能为空，不超过500字符

### AC-F01: 收藏查询

- GET /api/favorites 支持检查收藏状态和列表

### AC-F02: 收藏操作

- POST /api/favorites 添加收藏
- DELETE /api/favorites 取消收藏
- 重复收藏返回400

### AC-UI01: 四态覆盖

- 所有数据展示组件覆盖加载、空结果、错误、成功四态

### AC-AG01: Agent接入

- MCP Server提供6个工具函数
- 可通过WorkBuddy调用获取赛事数据

## 验证映射

| 测试文件                           | 覆盖AC                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------- |
| backend/test/prediction.test.mts   | AC-P01, AC-P02                                                         |
| backend/test/concurrency.test.mts  | AC-P03                                                                 |
| backend/test/match.test.mts        | AC-M01, AC-M02, AC-S01                                                 |
| backend/test/api-contract.test.mts | AC-T01, AC-M01, AC-M02, AC-S01, AC-P02, AC-C01, AC-C02, AC-F01, AC-F02 |
| frontend/test/smoke.test.mjs       | AC-UI01                                                                |

## 验收记录

- [ ] Backend lint passes
- [ ] Frontend lint passes
- [ ] Backend build passes
- [ ] Frontend build passes
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] npm run check passes
- [ ] Docker compose up works
- [ ] MCP agent connects to WorkBuddy
