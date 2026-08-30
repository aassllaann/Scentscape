# Scentscape

AI 辅助的感官可视化界面，用香调族群、香调结构、留香时间线、情绪参数和生成式视觉来探索香水数据。

[English](README.md) | [中文](README.zh-CN.md)

<!-- 预览图 / GIF 占位：完成视觉检查后，在这里加入最终界面截图或短交互 GIF。 -->

## 项目概览

Scentscape 是一个实验性的 creative technology 原型，把大规模香水数据转化为可交互的 olfactory atlas。用户可以浏览香调族群、搜索具体香水、查看香调组成，并把气味档案转译成视觉语言。

这个项目面向香水爱好者、creative technology 作品评审，以及 applied AI / interaction design 作品集场景。它没有把香水数据做成静态目录，而是把每支香水看作一个分层的感官系统：family、subfamily、top/heart/base notes、mood scores、时间中的 intensity，以及可选的 AI-generated synesthetic visual concept。

## 我的职责

- 设计 olfactory data interface 的产品概念、信息架构和视觉方向。
- 使用 Next.js / TypeScript 搭建前端，包括 fragrance wheel、搜索流程、详情面板、mood canvas 和 sillage timeline。
- 将香水数据整理并转换为 family、subfamily、mood、note-stage 和 intensity 等可交互字段。
- 实现 AI-assisted visualization routes，将香水档案转换为 JSON visual concept 和 p5.js generative sketch code。
- 使用 AI coding assistance 作为开发工作流支持，同时保持产品方向、交互决策、数据解释和最终实现审查由我主导。

## 核心功能

- **交互式香调轮：** 使用 D3 将 9 个 fragrance families 及其 subfamilies 渲染为径向 atlas，支持悬停预览和点击筛选。
- **香水搜索索引：** 用户可以按香水名或品牌搜索，并直接进入单支香水详情。
- **Family / subfamily 浏览：** 右侧面板展示匹配香水、保留总数统计，并对长列表做数量限制以便快速浏览。
- **香水详情面板：** 展示品牌、年份、性别倾向、subfamily、mood scores、香调结构和可选描述。
- **Sillage timeline：** 通过滑块和 intensity curve 表现 top、heart、base notes 在留香过程中的变化。
- **Mood-responsive canvas：** 页面背景会根据香水的 warmth、density、color 和 texture 等视觉参数变化。
- **AI 通感视觉：** 基于 DeepSeek 的 API routes 会从所选香水的气味档案生成 visual concept，并准备经过清理的 p5.js sketch 生成路径。
- **本地数据管线：** 脚本将 Fragrantica-style CSV/XLSX 源数据转换为应用可读取的 normalized JSON dataset。

## 技术栈

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4, custom CSS variables, `next/font`
- **Visualization:** D3.js, p5.js
- **Motion:** Framer Motion
- **AI:** DeepSeek chat completions，用于 visual concept generation 和 generative sketch planning
- **Data:** JSON fragrance dataset, CSV/XLSX transformation scripts

## 架构 / 工作流

```text
用户打开 Scentscape
        |
        v
FragranceWheel 渲染 family / subfamily atlas
        |
        +--> SearchBar 查询 /api/perfumes?q=
        |
        +--> Family 点击查询 /api/perfumes?family=
        |
        +--> Subfamily 点击查询 /api/perfumes?subfamily=
        |
        v
PerfumeDetail 展示 notes、mood、metadata 和 sillage
        |
        +--> MoodCanvas 更新环境背景
        |
        +--> SillageTimeline 映射时间中的 intensity
        |
        +--> AI Visualize 调用 /api/visualize/concept
                 |
                 v
              /api/visualize/render 准备经过清理的 p5.js sketch output
```

核心项目文件：

- `app/page.tsx`: 主应用双栏布局。
- `components/FragranceWheel/`: 基于 D3 的径向香调族群可视化。
- `components/PerfumeDetail/`: family 列表、subfamily 列表、香水档案、mood bars 和 AI visualize 入口。
- `components/SillageTimeline/`: intensity curve、时间滑块和 note-stage cards。
- `components/MoodCanvas/`: 由香水视觉参数驱动的环境背景系统。
- `app/api/perfumes/route.ts`: 香水搜索、family 和 subfamily API。
- `app/api/visualize/`: AI concept 与 p5.js render-generation routes。
- `data/perfumes.json`: 应用使用的 normalized perfume dataset。
- `scripts/import-fragrantica.mjs`: CSV-to-JSON 数据转换流程。

## 项目结果

- 归一化整理了 **37,923 条香水记录**，用于交互式搜索和 family exploration。
- 实现了 9-family olfactory taxonomy，支持 subfamily filtering 和 hover previews。
- 搭建了一个结合 data visualization、sensory interaction 和 AI-assisted generative-art planning 的可运行原型。
- 将 AI visual layer 设计为可选并在客户端缓存，使核心浏览体验不依赖反复生成 AI 概念。

## 本地运行

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000
```

常用开发命令：

```bash
npm run lint
npm run build
```

如需使用 AI visualization routes，请配置：

```bash
DEEPSEEK_API_KEY=your_api_key
```

## 数据说明

香水数据集来自本地 CSV/XLSX 源材料，并被转换为应用可读取的 JSON。Family、subfamily、mood 和 intensity 字段基于 note keywords 的启发式分类，应被视为探索型界面元数据，而不是官方香水分类体系。

部分记录拥有更完整的 note-stage 数据。当前中调和后调缺失时，应用会降级为更平铺的 notes 展示。

## 当前状态

- 已实现：fragrance wheel、搜索、family/subfamily 浏览、香水详情面板、mood canvas、sillage timeline、AI concept route、AI render route 和数据导入流程。
- 待完成：最终 GitHub screenshot/GIF、公开部署链接、移动端布局检查，以及公开作品集发布前的数据来源标注 polish。

## 仓库包装备注

建议 GitHub About 描述：

```text
AI-assisted sensory visualization interface for exploring perfume data through scent families, notes, sillage, and generative visuals.
```

建议 GitHub topics：

```text
creative-technology, human-ai-interaction, data-visualization, interactive-visualization, generative-ai, nextjs, typescript, d3, p5js
```

建议 LinkedIn Featured 标题：

```text
Scentscape - AI-Assisted Sensory Visualization Interface
```

建议 LinkedIn Featured 描述：

```text
Built an interactive perfume-data interface that combines fragrance-family visualization, note-stage exploration, sillage timelines, and AI-assisted generative visual concepts.
```
