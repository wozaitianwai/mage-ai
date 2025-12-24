# 国际化（i18n）页面任务指导说明书

本文档用于在本项目中**快速重新打开/接手国际化（i18n）相关任务**：定位相关代码、添加/修改翻译文案、验证语言切换效果，并给出常见排错方法。

## 1. 当前实现概览（重要结论）

- 前端框架：Next.js（目录：`mage_ai/frontend`）
- i18n 方案：`i18next` + `react-i18next` + `i18next-browser-languagedetector`
- 命名空间：当前仅使用 `common`（在 `mage_ai/frontend/utils/i18n.ts` 中配置）
- 语言资源：静态 JSON（在 `mage_ai/frontend/public/locales/{en,zh}/common.json`）
- 语言探测与持久化：优先读取 `localStorage`，其次读取浏览器语言（`navigator`），并写回 `localStorage`
- 回退语言：`zh`（缺少翻译时可能回退到中文，导致中英混杂；改动后务必双语自检）

## 2. 关键文件/目录速查

- i18n 初始化与资源注册：`mage_ai/frontend/utils/i18n.ts`
- 全局引入（保证 i18n 初始化只执行一次）：`mage_ai/frontend/pages/_app.tsx`（`import '@utils/i18n';`）
- 英文文案：`mage_ai/frontend/public/locales/en/common.json`
- 中文文案：`mage_ai/frontend/public/locales/zh/common.json`
- 语言切换组件：`mage_ai/frontend/components/LanguageSwitcher/index.tsx`

## 3. 快速重新打开任务（5 分钟内完成）

1) 启动前端开发环境

```bash
cd mage_ai/frontend
yarn install
yarn dev
```

2) 打开页面并确认当前语言

- Next.js 默认端口通常为 `http://localhost:3000`
- 如果语言没有按预期切换：打开浏览器 DevTools → Application/Storage → `localStorage`，检查/删除 `i18nextLng`

3) 定位任务涉及的页面/组件

- 页面入口一般在：`mage_ai/frontend/pages/**`
- 组件一般在：`mage_ai/frontend/components/**`
- 快速搜索翻译调用：

```bash
rg -n "useTranslation\\(|\\bt\\(" mage_ai/frontend
```

## 4. 常见任务流程

### 4.1 把页面硬编码文案改成可翻译文案

1) 在 React 组件中引入 `useTranslation` 并获取 `t`

```ts
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');
```

2) 用 `t('xxx.yyy')` 替换硬编码字符串

```ts
<Text>{t('header.today')}</Text>
```

3) 在两份语言文件中补齐 key

- `mage_ai/frontend/public/locales/en/common.json`
- `mage_ai/frontend/public/locales/zh/common.json`

示例（`header.today`）：

```json
{
  "header": {
    "today": "Today"
  }
}
```

4) 本地验证

- 页面在 `en` / `zh` 两种语言下都能正确显示
- 浏览器控制台无明显 `missingKey`（缺 key）相关日志

### 4.2 新增带变量的文案（插值）

代码：

```ts
t('pipelines.actions.edit_description_for', { name: pipeline?.uuid })
```

JSON（注意使用 `{{name}}` 占位）：

```json
{
  "pipelines": {
    "actions": {
      "edit_description_for": "Edit description for {{name}}"
    }
  }
}
```

### 4.3 新增带数量的文案（count）

如果需要在文案中展示数量：

```ts
t('pipelines.tabs.all_pipelines_with_count', { count })
```

在 JSON 中保留 `{{count}}`：

```json
{
  "pipelines": {
    "tabs": {
      "all_pipelines_with_count": "All pipelines ({{count}})"
    }
  }
}
```

> i18next 支持复数规则；如果要做严格的复数形态（如英文 one/other），建议在任务中明确规则与 key 约定后再落地。

### 4.4 新增一种语言（例如 `ja`）

1) 新增语言资源文件：

- 新建目录：`mage_ai/frontend/public/locales/ja`
- 新建文件：`mage_ai/frontend/public/locales/ja/common.json`

2) 在 `mage_ai/frontend/utils/i18n.ts` 注册资源：

- `import jaTranslation from '../public/locales/ja/common.json';`
- 在 `resources` 中新增 `ja: { common: jaTranslation }`
- 如需新增 namespace（不建议在未统一前擅自拆分）：同步更新 `ns` 与 `defaultNS`

3) 更新语言切换入口（如需要在 UI 中可选）：

- `mage_ai/frontend/components/LanguageSwitcher/index.tsx`

4) 验证语言探测与持久化（刷新页面后仍保持所选语言）

## 5. Key 命名与组织建议（避免后续维护成本）

- 统一放在 `common.json`（除非明确要做 namespace 拆分，并同步改 `mage_ai/frontend/utils/i18n.ts`）
- 使用“功能域/页面”为一级分组：例如 `header.*`、`sidebar.*`、`pipelines.*`、`sync_data.*`
- key 采用 `snake_case` 更贴近现有约定：如 `last_7_days`、`pipeline_runs`
- 避免语义复用：同一个中文词在不同上下文含义不同，不要共用一个 key

## 6. 自检清单（Definition of Done）

- 两种语言下页面均无明显错位/溢出（尤其是按钮、表头、提示文案）
- 新增/修改的 key 在 `en` 和 `zh` 中都存在（避免回退语言导致中英混杂）
- JSON 格式合法（无多余逗号、引号缺失等）
- 本地通过基础检查（按需执行）：

```bash
cd mage_ai/frontend
yarn lint
yarn type
```

## 7. 常见问题与排错

- 改了 JSON 但页面没变：
  - 确认改的是 `mage_ai/frontend/public/locales/**/common.json`
  - 尝试重启 `yarn dev`
  - 清除 `localStorage` 中的 `i18nextLng` 后刷新
- 页面显示 key 本身（例如 `header.today`）：
  - key 不存在或路径不对：检查 `common.json` 的嵌套结构是否一致
  - 使用了非 `common` namespace：当前默认只注册了 `common`
- 出现乱码/异常字符：
  - 确认 `common.json` 以 UTF-8 保存（建议编辑器统一使用 UTF-8）

