# バーチャルオフィス for Claude Code - 仕様書

## 概要

ターミナルを使わず、チャットUIから複数のClaudeエージェントに開発指示を出せるデスクトップアプリケーション。  
各エージェントはバックグラウンドで `claude -p` セッションとして動作し、並列で作業できる。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| デスクトップフレームワーク | Electron |
| フロントエンド | React + TypeScript |
| スタイリング | Tailwind CSS |
| バックグラウンド処理 | Node.js `child_process.spawn` |
| エージェント実行 | `claude -p`（Claude Code CLI） |
| 認証 | Claude Pro/Max サブスクリプション（APIキー不要） |
| 対応OS | macOS |

---

## 機能要件

### 1. エージェント管理

- エージェントを任意の数だけ作成・削除できる
- 各エージェントには以下の属性を設定できる
  - 名前（例：「フロントエンド担当」「レビュアー」）
  - アイコン/アバター（絵文字 or 画像）
  - 役割プロンプト（システムプロンプト相当のプリセット指示）
  - 作業ディレクトリ（担当するリポジトリパス）
  - 使用可能ツール（`--allowedTools` に渡す値）

### 2. チャットUI

- 各エージェントとの会話画面を持つ
- メッセージ入力 → `claude -p` に渡す → レスポンスをストリーミング表示
- 会話履歴を画面上で確認できる
- エージェントの作業ログ（ファイル操作・コマンド実行）をリアルタイム表示

### 3. 並列実行

- 複数エージェントに同時に指示を出せる
- 各エージェントは独立したプロセスとして動作
- 進行中タスクの状態（待機中 / 実行中 / 完了 / エラー）をUI上で表示

### 4. コンテキスト共有

- エージェント間で共有できる「共有メモ」機能（Markdownファイルベース）
- 共有ファイルのパスを指定するとエージェントに自動添付できる

### 5. ワークスペース管理

- プロジェクト単位でエージェント構成を保存・読み込みできる
- 設定は `~/.virtual-office/projects/<project-name>.json` に保存

---

## 非機能要件

- エージェントプロセスがクラッシュしても他のエージェントに影響しない
- アプリ終了時に全プロセスを安全に終了する
- macOS 13 (Ventura) 以降をサポート

---

## アーキテクチャ

```
[Electron Main Process]
  ├── AgentManager
  │     ├── spawn('claude', ['-p', prompt, '--allowedTools', ...])
  │     ├── stdout/stderr をパースしてUIに送信
  │     └── プロセスのライフサイクル管理
  └── IPC Bridge（Main ↔ Renderer）

[Electron Renderer Process（React）]
  ├── OfficeView         # エージェント一覧（バーチャルオフィス画面）
  ├── AgentChatView      # 個別エージェントとのチャット画面
  ├── AgentSettingModal  # エージェント設定モーダル
  └── SharedContextPanel # 共有メモパネル
```

---

## ディレクトリ構成（案）

```
virtual-office/
├── electron/
│   ├── main.ts          # Electronメインプロセス
│   ├── agentManager.ts  # claude -p プロセス管理
│   └── ipc.ts           # IPCハンドラ
├── src/
│   ├── components/
│   │   ├── OfficeView.tsx
│   │   ├── AgentCard.tsx
│   │   ├── ChatView.tsx
│   │   └── AgentSettings.tsx
│   ├── hooks/
│   │   └── useAgent.ts
│   ├── store/
│   │   └── agentStore.ts  # Zustand等で状態管理
│   └── types/
│       └── agent.ts
├── package.json
└── electron-builder.config.js
```

---

## エージェント設定スキーマ

```typescript
type Agent = {
  id: string;
  name: string;
  avatar: string;          // 絵文字 or 画像パス
  rolePrompt: string;      // プリセット指示（システムプロンプト相当）
  workDir: string;         // 作業ディレクトリの絶対パス
  allowedTools: string[];  // 例: ["Bash", "Edit", "Read"]
  status: 'idle' | 'running' | 'done' | 'error';
};
```

---

## IPC イベント一覧

| イベント名 | 方向 | 内容 |
|---|---|---|
| `agent:create` | Renderer → Main | エージェント新規作成 |
| `agent:delete` | Renderer → Main | エージェント削除 |
| `agent:send` | Renderer → Main | プロンプト送信 |
| `agent:stream` | Main → Renderer | レスポンスのストリーミング |
| `agent:done` | Main → Renderer | 実行完了通知 |
| `agent:error` | Main → Renderer | エラー通知 |
| `agent:status` | Main → Renderer | ステータス変更通知 |

---

## 開発フェーズ

### Phase 1 - PoC（優先）
- [ ] Electron + React の雛形作成
- [ ] `claude -p` をNode.jsからspawnして出力を取得
- [ ] シングルエージェントのチャットUIを動作させる

### Phase 2 - マルチエージェント
- [ ] 複数エージェントの並列起動と管理
- [ ] エージェント一覧のオフィスビュー画面
- [ ] プロセスのライフサイクル管理（起動・停止・再起動）

### Phase 3 - UX強化
- [ ] エージェント設定UI（名前・アバター・役割プロンプト）
- [ ] 作業ログのリアルタイム表示
- [ ] 共有コンテキスト機能
- [ ] プロジェクト設定の保存・読み込み

---

## 前提条件・制約

- `claude` コマンドがローカルにインストール済みであること（`npm install -g @anthropic-ai/claude-code`）
- Claude Pro または Max プランに加入済みであること
- Node.js 18以上
- macOS 13 (Ventura) 以降

---

## 未解決事項（要検討）

- 同一ファイルを複数エージェントが同時編集する際の競合解消策
- Maxプランのレート制限に達した場合のリトライ戦略
- エージェント間でのタスク依存関係（A完了後にBを起動など）の実装方法
