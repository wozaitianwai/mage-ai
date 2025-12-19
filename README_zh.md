# Mage OSS

### 快速、本地、可视化且面向生产的现代数据管道构建体验。

<br />

Mage OSS 是一个自托管的开发环境，帮助团队自信地创建生产级数据管道。

无论是自动化 ETL、搭建数据流，还是编排转换任务，都可以在快速的笔记本式界面中通过模块化代码完成。

当你需要扩展时，[Mage Pro](https://mage.ai)——我们的核心平台——提供企业级的编排、协作与 AI 驱动的工作流。

<br />

<a href="https://mage.ai"><img alt="Mage AI GitHub repo stars" src="https://img.shields.io/github/stars/mage-ai/mage-ai?style=for-the-badge&logo=github&labelColor=000000&logoColor=FFFFFF&label=stars&color=0500ff" /></a>
<a href="https://hub.docker.com/r/mageai/mageai"><img alt="Mage AI Docker downloads" src="https://img.shields.io/docker/pulls/mageai/mageai?style=for-the-badge&logo=docker&labelColor=000000&logoColor=FFFFFF&label=pulls&color=6A35FF" /></a>
<a href="https://github.com/mage-ai/mage-ai/blob/master/LICENSE"><img alt="Mage AI license" src="https://img.shields.io/github/license/mage-ai/mage-ai?style=for-the-badge&logo=codeigniter&labelColor=000000&logoColor=FFFFFF&label=license&color=FFCC19" /></a>
<a href="https://www.mage.ai/chat"><img alt="Join the Mage AI community" src="https://img.shields.io/badge/Join%20the%20community-black.svg?style=for-the-badge&logo=lightning&labelColor=000000&logoColor=FFFFFF&label=&color=DD55FF&logoWidth=20" /></a>

<br />

## Mage OSS 能做什么

- 使用 Python、SQL 或 R 在模块化的笔记本式界面中搭建管道
- 手动运行作业或按计划运行（支持 cron）
- 借助内置连接器连接数据库、API 和云存储
- 通过日志、实时预览和分步执行进行可视化调试
- 使用 Docker、pip 或 conda 快速安装，无需云账号
- 本地数据管道开发的首选工作空间，完全由你掌控

<img width="100%" alt="mage" src="https://github.com/user-attachments/assets/75992872-20a6-4120-8bf0-9c22a3d66450" />

<br /><br />

## 从本地开始，随时扩展

使用 Mage OSS 在本地构建并运行管道；当你需要高级工具、性能和 AI 助力时，Mage Pro 只需轻轻一点即可切换。

[**免费试用 Mage Pro →**](https://mage.ai)

<br />

### 快速开始

推荐使用 Docker 安装：

```bash
docker pull mageai/mageai:latest
```

或者使用 pip：

```bash
pip install mage-ai
```

或者使用 conda：

```bash
conda install -c conda-forge mage-ai
```

完整的安装指南请参考：[docs.mage.ai](https://docs.mage.ai/getting-started/setup#%E2%9B%B5%EF%B8%8F-mage-oss-overview)

<br />

## 核心特性

| 特性 | 描述 |
| :- | :- |
| 模块化管道 | 使用 Python、SQL 或 R 按模块构建管道 |
| 笔记本式 UI | 交互式编辑器，用于编写和记录逻辑 |
| 数据集成 | 预构建的数据库、API 与云存储连接器 |
| 调度 | 手动触发或按计划运行管道 |
| 可视化调试 | 分步日志、数据预览与错误处理 |
| dbt 支持 | 在 Mage 内直接构建并运行 dbt 模型 |

<br />

## 示例场景

- 使用 Python 转换，将 Google Sheets 数据同步到 Snowflake
- 安排每日 SQL 管道以清洗和汇总产品数据
- 在可视化的笔记本式界面中开发 dbt 模型
- 在本地透明地运行简单的 ETL/ELT 作业

<br />

## 文档

需要教程、示例或高级配置？

访问完整文档：[docs.mage.ai](https://docs.mage.ai)。

<br />

## 构建 Python 包

在仓库中生成 wheel 和源码包：

```bash
bash scripts/build_package.sh
```

## 在 Windows 上从源码启动

使用辅助脚本创建虚拟环境（如需要）、安装依赖并本地启动 Mage：

```bash
powershell -ExecutionPolicy Bypass -File scripts/start_windows.ps1 -ProjectName your_project
```

可选参数：

- `-Host`（默认 `localhost`）
- `-Port`（默认 `6789`）
- `-SkipInstall`：复用已安装的依赖

<br />

## 参与贡献

欢迎各种形式的贡献——修复 bug、改进文档、新功能或社区示例。

从我们的[贡献指南](https://docs.mage.ai/contributing/overview)开始，查看开放的 issue，或提出改进建议。

<br />

## 准备好扩展？Mage Pro 满足你的需求

Mage Pro 是为团队打造的增强平台，提供生产级管道所需的一切。

- AI 加持的开发与调试
- 多环境编排
- 基于角色的访问控制
- 实时监控与告警
- 强大的 CI/CD 与版本控制
- 企业级能力
- 提供全托管、混合或本地部署

[**免费试用 Mage Pro →**](https://mage.ai)
