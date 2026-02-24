# 王者荣耀排位模拟器

一款基于 Phaser 3 + Vite 构建的 H5 排位模拟器小游戏。玩家需要在 30 天内从青铜冲上王者段位，合理分配每日时间、管理资源和心态，最终成为最强召唤师。

## 玩法简介

- **目标**：30 天内段位从 🥉 青铜III 晋升至 👑 王者
- **失败条件**：精力归零 / 心态崩溃 / 沉迷度满 100 / 30 天内未登王者
- **时间管理**：每天 10 小时可支配时间，可透支但会受到惩罚
- **7 种行动**：排位、训练、观赛、代练、匹配、小憩、商店
- **随机事件**：观赛可能触发各种随机事件，带来惊喜或危机
- **商店系统**：使用金币购买道具恢复状态
- **段位体系**：青铜 → 白银 → 黄金 → 铂金 → 钻石 → 星耀 → 王者（共 19 个小段）

## 技术栈

- **Phaser 3** — 游戏引擎（场景管理）
- **Vite** — 构建工具
- **HTML/CSS DOM** — 全 UI 层（状态栏、行动面板、弹窗、商店）
- **localStorage** — 存档系统

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:17500` 即可游玩。

## 构建部署

```bash
npm run build
```

生成的静态文件在 `dist/` 目录，可部署到任何静态服务器。

## 项目结构

```
src/
├── scenes/          # Phaser 场景（MenuScene、GameScene）
├── systems/         # 核心系统（PlayerManager、ActionSystem、EventSystem、GameManager、SaveManager）
├── ui/              # DOM UI 组件（GameUI、EventModal、ShopModal）
├── data/            # 游戏数据（段位、随机事件、商店道具）
└── styles/          # CSS 样式
```
