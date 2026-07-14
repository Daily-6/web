问题处理报告
============

一、性能问题
----------------------------------------------------------------------

发现：前端首页 CourseDashboard 在 API 返回空数据时，仍显示 loading 骨架屏，
用户无法区分"正在加载"和"数据为空"两种状态。

定位：CourseDashboard 组件中，courses 初始值为空数组 []，加载完成后若 API 返回
空数组，条件判断 courses.length > 0 为 false，走入 else 分支显示骨架屏，
而非显示空状态提示。

解决：新增 loading 状态变量，显式控制加载态。加载完成后，根据 error / length===0
/ length>0 分别渲染错误、空状态、成功三态，骨架屏仅在 loading 为 true 时显示。

验证：同条件测试 —— 删除数据库中 courses 表数据后刷新页面，显示"暂无课程数据"提示，
而非骨架屏。npm run lint && npm run build 通过。

二、竞态资源问题
----------------------------------------------------------------------

场景：同一用户对同一场比赛提交比分预测。若用户在短时间内多次点击提交按钮，
或前端并发发送多个 POST 请求，可能产生重复预测记录。

风险：如果不加控制，同一用户对同一场比赛可能产生多条预测记录，违反业务规则
"同一用户对同一场比赛只能保留一条有效比分预测"。

机制：

1. 数据库层：predictions 表设置 UNIQUE(user_id, match_id) 约束，
   从根本上杜绝重复记录。
2. 服务层：PredictionService.create() 先查询是否存在已有预测，
   若存在则执行 UPDATE 更新比分，若不存在则 INSERT 新记录。
   同时检查比赛状态，若 match.status !== 'scheduled' 或比赛已开始，
   则抛出 BadRequestError 拒绝提交。
3. 前端层：提交按钮在请求期间设置 disabled 状态，防止用户重复点击。

开发测试：

- backend/test/concurrency.test.mts
  测试1：INSERT 两次相同 user_id+match_id，第二次因 UNIQUE 约束失败
  测试2：INSERT OR IGNORE 静默跳过重复记录
  测试3：验证最终仅存在一条记录
- 测试结果：5/5 通过（npm run check）

验证命令：
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test backend/test/concurrency.test.mts
