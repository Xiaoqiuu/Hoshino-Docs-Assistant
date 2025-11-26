# Hoshino 文档助手 — 高级需求文档（v1.0）

## 一、目标概述

启动后驻留后台，通过 `Ctrl+Alt+H` 唤出一个现代 AI 搜索框：未选中文本时作为普通聊天助手；当检测到用户在当前窗口/页面有选中文本时，自动以该文本为上下文做检索增强问答（RAG），并提供源引用、跳转到原文位置与后续处理能力。

---

## 二、总体要求（目标效果）

* 常驻后台：开机/启动后在系统托盘/状态栏常驻，资源占用低。
* 全局唤出：按住 `Ctrl+Alt+H`（可自定义）立即唤出界面，即便 Hoshino 没有焦点也能响应（实现方式参考 Electron globalShortcut）。 ([Electron][1])
* 两种基本交互模式：

  * **普通聊天**（无选中或用户主动切换）——与通用 LLM 对话。
  * **基于文档的问答（RAG）**（检测到选中文本或用户显式“读取文档”）——取出/索引当前文档相关段落，执行检索 + 生成，结果带来源/页码并支持跳转回文档位置（若可）。 RAG 的设计应遵循当前最佳实践以平衡效率与准确性。 ([arXiv][2])

---

## 三、关键用户故事（示例）

1. 作为读者，我按 `Ctrl+Alt+H` 唤起 Hoshino，输入“帮我总结这篇文章”，助手在未选中文本下返回通用摘要。
2. 作为审阅者，我在 PDF 中选中文本后按 `Ctrl+Alt+H`，助手检索选中附近段落并回答“这段话的依据是什么”，同时提供页码并能跳回该页。
3. 作为隐私敏感用户，我在设置中开启“仅本地处理”，所有文档与索引不上传云端。
4. 作为高级用户，我在设置中绑定 DeepSeek API（或其他模型提供商），并能选择是否把 RAG 的生成请求走到 DeepSeek。（见设置细节与风险提示）

---

## 四、功能需求（按优先级）

### A. 基本（MVP 必备）

* 后台常驻 + 系统托盘/状态栏图标。
* 全局快捷键注册（`Ctrl+Alt+H` 默认，可自定义）。必须能在应用无焦点时触发弹窗。([Electron][1])
* 弹窗 UI（单行/多行现代搜索框风格）＋历史短记录（最近 10 条会话）。UI 动作响应需 <300ms（显示/隐藏）。
* 未选中文本：对话模式（与远端或本地模型交互）。
* 选中文本检测：支持在主流环境（浏览器 content script、系统层面选中检测、或集成常见 PDF 阅读器/Office 的插件桥接）捕获选中文本并把文本上下文传入弹窗。浏览器扩展可使用 contextMenus / content scripts 获取选中文本并与本地应用通信。([Chrome for Developers][3])
* 简单 RAG 流程：把文档分块（chunking）并生成嵌入，用选中文本做检索，检索 top-K 段落作为生成上下文，生成回答并列出来源（chunk id、页码）。（实现细节见技术架构）([arXiv][2])

### B. 增强（1–2 迭代后）

* 文档解析：支持 PDF、DOCX、PPTX、网页、Markdown 的提取（首发可只支持可选文本的 PDF + 网页，再逐步加 Word/PPT）。推荐使用成熟库（如 PyMuPDF/pdfplumber 等）按场景选择。([jishuzhan.net][4])
* 跳转功能：在支持的阅读器/浏览器中能跳转回原始位置（页码或DOM锚点）。
* 回答带引用：每条回答末尾自动列出“来源：文件名 / 页码 / 摘要片段”，并允许用户点击查看原文位置。([haruiz.github.io][5])
* 会话管理：保存问答历史、允许打标签/收藏/导出（Markdown/JSON）。
* 设置面板：模型绑定、API Key 管理（DeepSeek、OpenAI 等）、本地/云模式切换、热键自定义、隐私选项（加密存储、自动清理历史）。（DeepSeek 绑定示例见下）

### C. 高级（后续）

* 支持图表/表格理解（提取图表 caption 和表格结构并进行专门解析）、多文档跨文档检索、企业级权限与团队共享。
* 本地化轻量模型（可选，降低调用成本并提高隐私）。
* 对 RAG 的检索器/嵌入器微调与缓存策略以提升精确度与效率。([arXiv][2])

---

## 五、设置与 DeepSeek API 绑定（详细）

**设置项（最低）**

* 模型提供商（下拉）：`DeepSeek` / `OpenAI` / `Custom (base_url)`。
* API Key / Secret（安全输入框） + “测试连接”按钮（返回成功/错误）。
* Base URL（自定义 API 时用）。
* 模型选择（例如 `deepseek-chat`, `deepseek-reasoner`）与流式选项（stream on/off）。（DeepSeek 文档说明其 API 与 OpenAI 兼容，提供示例调用格式）。 ([DeepSeek API Docs][6])

**DeepSeek 风险 & 建议（必须展示给用户）**

* DeepSeek 曾出现服务中断、以及第三方披露的安全事件/数据暴露报道；若业务/法规对敏感数据有高要求，应慎用第三方托管或至少启用脱敏/本地化选项并严格管控 API Key。建议：在设置页显著提示、默认关闭“上传敏感文档到云端”，并提供“仅本地处理”选项。（参考公开报道与安全事件）。 ([Reuters][7])

**实现细节**

* 在 UI 提供“绑定 DeepSeek”入口：输入 API Key → 点击 “测试” → 成功后标记为已绑定。
* 对请求做流量限制、重试策略与超时（例如 10s 超时默认），并在 UI 明确显示调用成本/计费风险（可选）。
* 提供“回退”机制：当 DeepSeek 请求失败或响应异常时，自动降级到本地轻量模型或给出友好错误提示。

---

## 六、技术架构（高层）

1. **前端（桌面）**：Electron（React）或 Tauri + 前端框架。Electron 提供 `globalShortcut` 注册以实现全局热键。([Electron][1])
2. **浏览器扩展**（可选但推荐）：Chrome/Firefox 扩展用于在网页环境获取选中文本并与桌面 App 通信（native messaging / WebSocket）。可利用 contextMenus、content scripts 获取选中文本。([Chrome for Developers][3])
3. **文档解析服务（本地或容器）**：解析 PDF/DOCX/PPTX → 文本清洗 → 分块（chunking）→ 嵌入（embedding）→ 索引（FAISS/Weaviate/Chroma）。推荐首批使用成熟 Python 库（PyMuPDF/pdfplumber）来保障文本提取质量。([jishuzhan.net][4])
4. **检索器 + RAG 层**：查询时先检索 top-K chunk → 将这些 chunk 与用户问题一起送入生成模型（本地或 DeepSeek/OpenAI）。遵循 RAG 最佳实践以权衡效率与准确性（分页、缓存、结果验证）。([arXiv][2])
5. **模型层**：可接入云 API（DeepSeek/OpenAI）或本地部署小模型（如 Llama 系列，视资源）。
6. **存储**：本地索引 + 可选云备份（加密存储），会话历史和用户设置本地持久化（加密）。
7. **安全层**：输入/输出审计、敏感信息过滤、API Key 安全存储（系统钥匙串）、传输层 TLS 加密。

---

## 七、数据流与交互详解（选中文本 RAG 用例）

1. 用户在文档/网页选中一段文本 → 浏览器扩展或前端捕获选中文本并发送给 Hoshino 主进程。([geek-docs.com][8])
2. Hoshino 检查本地索引是否已存在该文档（若无则异步导入并分块索引）。文档解析模块用 PyMuPDF/pdfplumber 提取文字并生成 metadata（页码/段落 id）。([jishuzhan.net][4])
3. 执行向量检索（embedding + nearest-neighbor），返回 top-K chunk（包含页码/文档片段）。([arXiv][2])
4. 将 user question + retrieved chunks 传入模型（DeepSeek/OpenAI/local）；生成答案并附带来源列表。若使用云 API，应在 UI 明显告知“此查询将上传文档片段/问题到供应商”。（用户可选择“仅本地处理”）
5. UI 显示回答 + 源列表；用户可点击某个源以跳转到文档位置（若阅读器支持跳转）。

---

## 八、安全与合规（要点）

* **最小化外传数据**：默认不上传整文档到云端，只上传检索到的必要 chunk 并尽可能做脱敏/截短。
* **防 prompt injection 与检索中毒**：RAG 增加攻击面，需对检索到的内容做来源校验、过滤可疑指令，并在模型 prompt 中加入防注入 guardrail。参考近期研究表明 RAG 容易受 prompt-injection / 数据中毒攻击，需在设计中加入防护策略（输入预处理、taint tracking、审计与回退）。 ([arXiv][9])
* **来源可溯与可审计**：所有生成回答应明示来源（document id + chunk offset + 页码）以便用户验证与审计。([haruiz.github.io][5])
* **对 DeepSeek 等第三方服务的合规提示**：向用户显示第三方服务的安全/合规公告（若已知），并在绑定时显示风险提示。参考公开报道建议对供应商信誉做额外核查。 ([The Verge][10])

---

## 九、性能 & 可用性要求

* 唤出 UI <300ms（可先实现视觉上迅速弹出，后台再异步加载上下文）。
* 文档首次索引（100页以内）≤ 30s（异步建立索引并在后台更新）。
* 检索 + 回答（RAG）平均响应 ≤ 3s（若使用云模型，含网络延迟则需更灵活的体验提示与进度条）。
* 内存/CPU 占用在空闲时需低（桌面 app 运行但不索引时 <200MB）。

---

## 十、错误处理与回退策略

* 模型调用失败 → 回退到本地轻量生成 / 提示用户“云端不可用，请稍后重试”。
* 文档解析失败（扫描件/图像 PDF）→ 提供 OCR 选项或明确提示“此文档为扫描件，请先 OCR”。
* 快捷键冲突 → 在设置页检测常见冲突（系统或已安装应用），并提示用户修改。([CSDN][11])

---

## 十一、测试 & 验收标准（示例）

* 功能测试：在 Windows/macOS 中按 `Ctrl+Alt+H` 唤出（默认）并能在无焦点下工作（通过 Electron globalShortcut 验证）。([Electron][1])
* RAG 验收：在测试 PDF（含 20 页）中选中句子并提问，返回答案需包含至少 1 个正确来源片段且能跳转到正确页码。
* 隐私验收：当用户开启“仅本地处理”时，无网络请求发送文档内容（网络监测测试）。
* 极端场景：处理 500 页以上文档时应能分段索引且保持 UI 可交互（背景索引）。

---

## 十二、MVP 范围（建议）

**首版只做核心且可交付的体验：**

* 桌面 Electron App（Windows + macOS 支持）常驻 + `Ctrl+Alt+H` 唤出。([Electron][1])
* 支持可选文本的 PDF 与网页（via 浏览器扩展）解析 → 分块索引 → 选中文本触发 RAG → 返回答案并列来源（页码/段落）。([jishuzhan.net][4])
* 设置页：API Key 管理（DeepSeek/OpenAI）、热键自定义、本地处理开关。显示 DeepSeek 绑定与风险提示。([DeepSeek API Docs][6])

---

## 十三、后续路线图（建议）

* v1 (MVP)：上面 MVP 范围（6–10 周）。
* v2：Word/PPT 支持、跳转增强、更多模型绑定（4–8 周）。
* v3：团队/企业功能、云同步、图表/表格理解（8–16 周）。
* 安全迭代：针对 RAG 的注入防护、审计与检测（并行进行）。

---

## 十四、关键风险总结（快速一览）

1. **RAG 的“幻觉”与检索中毒/注入风险** —— 需要来源可追溯与防注入机制。 ([arXiv][9])
2. **文档解析挑战（扫描件、复杂布局）** —— 先限定支持格式并给出降级方案（OCR 提示）。 ([jishuzhan.net][4])
3. **第三方模型服务（如 DeepSeek）安全/合规问题** —— 在设置中加入风险提示，并提供本地处理选项作为替代。 ([DeepSeek API Docs][6])
4. **跨平台快捷键与浏览器兼容性** —— 先确定支持矩阵（Windows/macOS + Chrome/Edge/Firefox），并在设置里允许用户自定义热键以避免冲突。 ([Electron][1])


```sequenceDiagram
    participant User as 用户
    participant UI as Hoshino UI (弹窗)
    participant Core as Hoshino Core (主进程)
    participant Ext as Browser/Reader Connector
    participant Parser as Document Parser
    participant Index as Vector Index (FAISS/Chroma)
    participant Retriever as Retriever
    participant Model as Model API (DeepSeek/OpenAI/local)
    participant Storage as Local Storage

    User->>UI: Ctrl+Alt+H（唤出）
    UI->>Core: 请求上下文（当前活动窗口、选中文本）
    Core->>Ext: 获取选中文本 / 文档元信息
    Ext-->>Core: 返回选中文本 (或空)
    Core->>Storage: 检查文档索引是否存在
    alt 索引存在
        Core->>Index: 检索(选中文本或query)
    else 索引不存在
        Core->>Parser: 请求解析文档（异步）
        Parser-->>Core: 返回分块 & 元数据（页码）
        Core->>Index: 写入嵌入与索引
        Core->>Index: 检索(topK)
    end
    Index-->>Retriever: 返回 topK chunks
    Core->>Model: 发送 prompt + retrieved chunks
    Model-->>Core: 返回答案 + 来源
    Core->>UI: 展示答案（含来源、跳转按钮）
    UI-->>User: 显示结果
    alt 用户点击“跳转到来源”
        UI->>Ext: 请求跳转到对应页码/DOM位置
        Ext-->>UI: 跳转成功/失败
    end
```

```flowchart TD
  A[启动 Hoshino (后台驻留)] --> B{按下 Ctrl+Alt+H ?}
  B -- 否 --> A
  B -- 是 --> C[唤出弹窗 UI]
  C --> D{是否检测到选中文本?}
  D -- 否 --> E[普通对话模式 (直接发到模型 API)]
  E --> F[展示聊天回复]
  D -- 是 --> G[准备 RAG 流程]
  G --> H{本地是否有索引?}
  H -- 是 --> I[检索 top-K chunks]
  H -- 否 --> J[解析文档 -> 分块 -> 生成嵌入 -> 写入索引]
  J --> I
  I --> K[构造 prompt (question + chunks)]
  K --> L[调用模型 API（DeepSeek/OpenAI/local）]
  L --> M[展示答案 + 来源（页码/段落）]
  M --> N{用户是否点击“跳转”?}
  N -- 是 --> O[调用阅读器/扩展跳转到原始位置]
  N -- 否 --> P[结束会话或等待下一次唤出]
  %% 错误/回退
  L -- 调用失败 --> Q[回退：本地轻量模型 或 提示网络错误]
  J -- 解析失败 --> R[提示 OCR/格式不支持]
```

```graph TD
  UI[Hoshino UI (弹窗/侧栏)]
  Shortcut[ShortcutManager]
  Core[Core App / Main Process]
  Ext[Connector (Browser/Reader Extension)]
  Parser[Document Parser (PDF/DOCX/PPTX)]
  Index[Vector DB / Index (FAISS/Chroma/Weaviate)]
  Retriever[Retriever Service]
  ModelAdapter[Model Adapter (DeepSeek/OpenAI/local)]
  Storage[Local Storage (settings, history)]
  Security[Security & Encryption]
  Settings[Settings (API Keys, DeepSeek bind)]
  OCR[OCR Service (可选)]

  Shortcut --> UI
  UI --> Core
  Core --> Ext
  Ext --> Parser
  Parser --> Index
  Index --> Retriever
  Retriever --> ModelAdapter
  ModelAdapter --> Core
  Core --> Storage
  Core --> Settings
  Core --> Security
  Parser --> OCR
  Security --> Storage
  Settings --> ModelAdapter
```