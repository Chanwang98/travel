# 旅迹 · Travel Planner

一款 Apple 风格的个人旅行规划工具，用清晰的时间轴整理每一段旅程。

## 在线体验

https://travel-planner-chan.giving-cod-3613.chatgpt.site

## 功能

- 新增、编辑和删除行程
- 按日期与时间段展示旅行时间轴
- 支持飞机、高铁、火车、地铁、公交、打车、自驾、骑行、步行和轮渡
- 记录车次、座位、地铁线路、进出站口、预计费用及其他备注
- 拖拽调整行程顺序
- Cloudflare D1 持久化保存
- 导出 PDF 与 Word
- 桌面端与移动端响应式布局

## 本地开发

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

生产构建：

```bash
npm run build
```

## 技术栈

Vinext、React 19、TypeScript、Cloudflare D1、Drizzle ORM。
