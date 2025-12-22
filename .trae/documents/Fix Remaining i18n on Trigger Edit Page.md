我将把页面上仍未适配的 `p`、`div`、`input`、`select` 文本一次性修正为国际化展示，并验证在中英文切换下均正确显示。

## 要修复的区域
- Timeout 状态说明与下拉（占位与选项：Failed/Cancelled）
- SLA 配置文案与两个输入框占位（Time、Select time unit）
- 运行时变量输入（New variable UUID、Variable value、Add runtime variable）
- Payload 标题与说明（确保使用翻译）

## 实施步骤
1. 全量排查硬编码：在 `components/Triggers/Edit/index.tsx` 与 `components/Triggers/OverwriteVariables/index.tsx` 中，全面替换剩余硬编码为 `t()`，包含：
   - Timeout 文案：`triggers.edit.run_settings.*`
   - SLA 文案与占位：`triggers.edit.sla.*`
   - 运行时变量：`triggers.edit.runtime_variables.*`
   - 导航与说明：已适配的保持一致（若仍有遗漏补齐）。
2. 统一下拉选项国际化：
   - Timeout 下拉的选项使用 `t('triggers.edit.run_settings.status_failed')` 与 `t('triggers.edit.run_settings.status_cancelled')`。
   - SLA 时间单位选项使用 `t('triggers.edit.sla.unit_day|hour|minute|second')`。
3. 运行时变量组件：
   - 在 `OverwriteVariables` 中使用父组件传递的 `t`（已有），若仍出现占位显示为原始 key，确保命名空间与 key 拼写正确并启用 `useTranslation('common')` 作为后备。
4. Payload 文案：
   - 确认 `Payload` 标题与说明使用 `t('triggers.edit.payload.*')` 或 `Trans`（如果包含换行或链接），保持一致。
5. 校验与预览：
   - 运行类型检查与页面刷新，确认所有元素在英/中文下均显示翻译文案，而非原始 key 或英文硬编码。

## 验证要点
- 所有指定元素的文本与占位，在语言切换后立即反映翻译。
- 下拉选项及其占位均为翻译文案。
- 不出现原始 key（如 `triggers.edit.runtime_variables.key_placeholder`）。