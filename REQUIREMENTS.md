# 个人学术主页 + 活动推荐系统 — 需求文档 & 实施状态

> 最后更新：2026-05-31

## 1. 项目概述

部署在 GitHub Pages 上的个人主页（https://dekumylove.github.io），包含四个核心模块：学术成果展示、博客系统、个人经历、情侣活动推荐。支持中英文双语切换。

---

## 2. 技术架构

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | **Astro 5** | 静态站点生成器，岛屿架构，默认零 JS |
| 样式 | **Tailwind CSS 4** | Vite 插件集成，原子化 CSS |
| 交互 | **Preact**（岛屿组件，.tsx） | 轻量（3KB），仅活动推荐 + 管理后台使用 |
| 内容管理 | 后台管理面板通过 **GitHub API** 直接 commit | 无需额外服务，浏览器内编辑 |
| 数据源 | Semantic Scholar API（学术）；各平台公开 API（活动推荐） |
| 部署 | **GitHub Pages**，GitHub Actions 自动构建 |
| 多语言 | Astro i18n 路由（`/zh/`、`/en/`）|
| SEO | `@astrojs/sitemap` + `robots.txt` + JSON-LD 结构化数据 |

---

## 3. 模块实施状态

### 3.1 学术成果 ✅ 已完成

- **数据来源**：Semantic Scholar Author API（作者 ID 在 profile.json 中配置）
- **展示内容**：论文标题、作者列表、年份、期刊/会议、引用量
- **交互**：年份筛选 + 引用量排序（Preact 岛屿，客户端 DOM 操作）
- **更新策略**：
  - 主数据源：`src/data/academic.json`（committed 缓存）
  - 自动更新：GitHub Actions 每月 1 号 cron（免费，无需 API key）
  - 手动更新：Actions → Refresh Academic Data → Run workflow
  - 构建时若 JSON 缺失，自动 fallback 到实时 API

### 3.2 博客 ✅ 已完成

- **撰写方式**：后台管理面板（`/admin/`）浏览器内编辑
  - 新建文章：填写标题、slug、标签、Markdown 正文
  - 编辑文章：按语言加载已有文章列表 → 选择 → 修改 → 更新
  - 切换新建/编辑模式时自动清空表单
- **展示**：文章列表页 + 文章详情页，标签分类
- **代码高亮**：Shiki 语法高亮（`github-light` / `github-dark-dimmed` 双主题）
- **数据存储**：Markdown 文件存于 `src/content/blog/{zh,en}/`，Astro 内容集合
- **Decap CMS**：已配置（`/admin/index.html`），需 OAuth 设置后可选用

### 3.3 个人经历 ✅ 已完成

- **展示形式**：垂直时间线（教育 + 工作经历）+ 项目卡片（标签、链接）
- **数据维护**：`src/data/experience.json`，通过后台管理面板编辑
- **后台功能**：添加/编辑/删除条目，双语字段，日期范围

### 3.4 情侣活动推荐 ✅ 已完成

- **功能**：城市下拉选择、6 类活动标签筛选、收藏标记（"想去"/"去过"）
- **收藏**：存 localStorage，跨会话持久化
- **数据来源**：
  - 当前：6 条示例数据（覆盖全部 6 个分类）
  - 自动更新：GitHub Actions 每周日 cron（需配置 Eventbrite/SerpAPI key）
  - 手动更新：Actions → Fetch Activity Data → Run workflow
- **城市**：初始北京，配置在 `src/content/config/cities.yaml` 便于扩展

### 3.5 后台管理面板 ✅ 已完成（新增）

- **路由**：`/admin/`
- **认证**：密码登录（SHA-256 哈希存于 `src/data/admin.json`）
- **默认密码**：`admin`（建议首次登录后在 Settings 标签中修改）
- **GitHub Token**：单独配置（Settings 标签），用于提交修改到仓库
- **标签页**：

| 标签 | 功能 |
|---|---|
| Profile | 编辑姓名、简介、社交链接、Scholar ID |
| Experience | 教育/工作/项目条目的增删改 |
| Blog | 新建 Markdown 文章 / 加载编辑已有文章 |
| Settings | 配置 GitHub Token、修改登录密码 |

### 3.6 SEO ✅ 已完成

- `sitemap-index.xml`：`@astrojs/sitemap` 自动生成
- `robots.txt`：指向 sitemap
- JSON-LD：首页 Person schema 结构化数据
- 已提交 Google Search Console / Baidu / Bing 后搜索可见

---

## 4. 数据自动更新机制

| 数据 | Cron 频率 | Workflow | 需要 API Key？ |
|---|---|---|---|
| 学术成果 | 每月 1 号 | `fetch-academic.yml` | ❌ 免费 |
| 活动推荐 | 每周日 | `fetch-activities.yml` | ⚠️ 需要配置 |

两种 workflow 均支持 `workflow_dispatch` 手动触发。

---

## 5. 页面路由

```
/                    → 语言检测 → 302 重定向
/admin/              → 后台管理面板
/zh/                 → 中文首页
/zh/academic/        → 学术成果
/zh/blog/            → 博客列表
/zh/blog/[slug]/     → 博客详情
/zh/experience/      → 个人经历
/zh/activities/      → 活动推荐
/en/                 → English home
/en/academic/        → Academic
/en/blog/            → Blog list
/en/blog/[slug]/     → Blog post
/en/experience/      → Experience
/en/activities/      → Activities
```

---

## 6. 关键数据文件

| 文件 | 用途 | 编辑方式 |
|---|---|---|
| `src/data/profile.json` | 姓名、简介、社交链接 | Admin 面板 / 手动 |
| `src/data/experience.json` | 教育、工作、项目 | Admin 面板 / 手动 |
| `src/data/academic.json` | 论文数据缓存 | Cron 自动更新 / 手动 |
| `src/data/activities.json` | 活动数据 | Cron（需 key）/ 示例数据 |
| `src/data/admin.json` | 密码哈希 | Settings 标签 |
| `src/i18n/{zh,en}.json` | UI 文案翻译 | 手动编辑 |

---

## 7. 待办 / 可扩展项

| 项目 | 优先级 | 说明 |
|---|---|---|
| 配置活动 API key | 中 | Eventbrite + SerpAPI，使活动数据可自动抓取 |
| Decap CMS OAuth | 低 | 备选博客编辑方案，当前 Admin 面板已满足需求 |
| 更多城市 | 低 | cities.yaml 添加条目即可 |
| Giscus 评论 | 低 | 博客评论系统，基于 GitHub Discussions |
| 暗色模式完善 | 低 | 各模块独立适配已做，细节可优化 |
| RSS 订阅 | 低 | `@astrojs/rss` 一行生成 |
