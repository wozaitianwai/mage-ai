# Internationalization of Version Control Page

I will implement internationalization (i18n) for the Version Control page (`/version-control`). This involves updating translation files and React components to replace hardcoded English strings with translation keys.

## 1. Update Translation Files

I will add the following keys to `mage_ai/frontend/public/locales/en/common.json` and their Chinese equivalents to `mage_ai/frontend/public/locales/zh/common.json`:

*   `version_control.title`: "Version control" / "版本控制"
*   `version_control.setup`: "Setup" / "设置"
*   `version_control.git_init_directory`: "Git init directory" / "Git 初始化目录"
*   `version_control.initialize_git_directory`: "Initialize Git directory" / "初始化 Git 目录"
*   `version_control.enter_directory_hint`: "Enter the directory..." / "输入您要初始化 git 的目录..."
*   `version_control.git_directory_label`: "Git directory" / "Git 目录"
*   `version_control.authentication`: "Authentication" / "认证"
*   `version_control.remotes`: "Remotes" / "远程"
*   `version_control.new_remote_name`: "New remote name" / "新远程名称"
*   `version_control.remote_url`: "Remote URL" / "远程 URL"
*   `version_control.create_new_remote`: "Create new remote" / "创建新远程"
*   `version_control.actions`: "Actions" / "操作"
*   `version_control.current_branch`: "Current branch" / "当前分支"
*   `version_control.switch_branch`: "Switch branch" / "切换分支"
*   `version_control.action`: "Action" / "操作"
*   `version_control.remote`: "Remote" / "远程"
*   `version_control.additional_argument`: "Additional argument" / "附加参数"
*   `version_control.execute_action`: "Execute action" / "执行操作"
*   `version_control.branches`: "Branches" / "分支"
*   `version_control.choose_a_remote`: "Choose a remote" / "选择远程"
*   `version_control.new_branch_name`: "New branch name" / "新分支名称"
*   `version_control.create_new_branch`: "Create new branch" / "创建新分支"
*   `version_control.compare_branch`: "Compare branch" / "比较分支"
*   `version_control.choose_action`: "Choose action" / "选择操作"
*   `version_control.message_for`: "Message for {{action}}" / "{{action}} 的消息"
*   `version_control.push_pull_requests`: "Push & Pull Requests" / "推送 & 拉取请求"
*   `version_control.branch`: "Branch" / "分支"
*   `version_control.create_pull_request`: "Create pull request" / "创建拉取请求"
*   `version_control.repository`: "Repository" / "仓库"
*   `version_control.choose_repository`: "Choose repository" / "选择仓库"
*   `version_control.choose_branch`: "Choose branch" / "选择分支"
*   `version_control.title_label`: "Title" / "标题"
*   `version_control.description_label`: "Description" / "描述"
*   `version_control.pull_requests`: "Pull requests" / "拉取请求"
*   `version_control.not_staged`: "Not staged" / "未暂存"
*   `version_control.add_files`: "Add files" / "添加文件"
*   `version_control.checkout_files`: "Checkout files" / "检出文件"
*   `version_control.staged_files`: "Staged files" / "已暂存文件"
*   `version_control.reset_files`: "Reset files" / "重置文件"
*   `version_control.commit`: "Commit" / "提交"
*   `version_control.no_staged_files`: "No staged files" / "没有已暂存文件"
*   `version_control.commit_message`: "Commit message" / "提交消息"
*   `version_control.commit_files_with_message`: "Commit {{count}} {{file}} with message" / "提交 {{count}} 个{{file}}并附带消息"
*   `version_control.authenticate`: "Authenticate" / "认证"
*   `version_control.reset`: "Reset" / "重置"
*   `version_control.logs`: "Logs" / "日志"

## 2. Update Components

I will update the following components to use the `useTranslation` hook and replace hardcoded strings with the new keys:

*   `mage_ai/frontend/components/VersionControl/index.tsx`:
    *   Translate page title.
    *   Translate tabs ("Remote & Auth", "Branches", "Commit", "Push & Pull Requests", "All projects", "Git directory").
*   `mage_ai/frontend/components/VersionControl/Remote/index.tsx`:
    *   Translate "Setup", "Git init directory", "Initialize Git directory", etc.
*   `mage_ai/frontend/components/VersionControl/Remote/Authentication.tsx`:
    *   Translate "Authentication", "Authenticate", "Reset".
*   `mage_ai/frontend/components/VersionControl/Branches/index.tsx`:
    *   Translate "Branches", "Remote", "Current branch", "New branch name", etc.
*   `mage_ai/frontend/components/VersionControl/Commit/index.tsx`:
    *   Translate "Push & Pull Requests", "Create pull request", etc.
*   `mage_ai/frontend/components/VersionControl/GitFiles/index.tsx`:
    *   Translate "Not staged", "Staged files", "Commit", etc.

I will verify the changes by checking the file content updates.
