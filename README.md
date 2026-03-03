# Virtual Office for Claude Code

ターミナルを使わず、チャットUIから複数のClaudeエージェントに開発指示を出せるデスクトップアプリ。
各エージェントはバックグラウンドで `claude -p` セッションとして動作し、並列で作業できる。

![Virtual Office](https://img.shields.io/badge/platform-macOS-lightgrey) ![Electron](https://img.shields.io/badge/Electron-30-47848F) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## 前提条件

- macOS 13 (Ventura) 以降
- Node.js 18 以上
- [Claude Code](https://github.com/anthropics/claude-code) がインストール済み (`npm install -g @anthropic-ai/claude-code`)
- Claude Pro または Max プランに加入済み（`claude` コマンドで認証済みであること）

## インストール

```bash
git clone https://github.com/ganganbiz1/virtual-coding.git
cd virtual-coding
npm install
```

## 起動

```bash
npm run dev
```

## 使い方

### 1. エージェントを作成する

1. 起動すると **Virtual Office** 画面が表示される
2. 右上の **「+ New Agent」** をクリック
3. 以下を設定してエージェントを作成する

| 項目 | 説明 |
|---|---|
| Avatar | エージェントのアイコン絵文字 |
| Name | エージェントの名前（例: フロントエンド担当） |
| Work Directory | 作業対象のリポジトリのパス（Browse で選択可） |
| Role Prompt | エージェントへの役割指示（例: あなたはReact専門のエンジニアです） |
| Allowed Tools | 使用を許可するツール（Bash / Edit / Read など） |

### 2. チャットで指示を送る

1. エージェントカードをクリックしてチャット画面を開く
2. 下部のテキストエリアに指示を入力
3. **Enter** で送信（Shift+Enter で改行）
4. レスポンスがリアルタイムでストリーミング表示される

### 3. 複数エージェントを並列実行する

- エージェントカード画面（Virtual Office）から複数のエージェントを作成
- それぞれのエージェントに独立して指示を送ることで並列実行が可能
- カードのステータスバッジで状態を確認できる

| ステータス | 意味 |
|---|---|
| Idle | 待機中 |
| Running | 実行中（青くパルス） |
| Done | 完了 |
| Error | エラー発生 |

### 4. 共有コンテキストを使う

複数エージェントに共通の情報（仕様書・設計メモなど）を渡す機能。

1. ツールバーの **「📄 Shared Context」** をクリック
2. **「+ Add File」** でMarkdownファイルを追加・編集
3. チャット画面の **Context** セレクターでファイルを選ぶと、プロンプトに自動添付される

### 5. プロジェクトを保存・読み込む

エージェント構成をプロジェクトとして保存しておける。

1. ツールバーの **「💾 Project ▾」** をクリック
2. プロジェクト名を入力して **「Save Project」**
3. 次回起動時は **「Load Recent Project」** で復元

設定ファイルの保存場所: `~/.virtual-office/projects/<project-name>.json`

## ビルド（配布用DMG作成）

```bash
npm run package
```

`dist/` フォルダにmacOS用DMGが生成される。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| デスクトップ | Electron 30 |
| フロントエンド | React 18 + TypeScript 5 |
| スタイリング | Tailwind CSS v3 |
| 状態管理 | Zustand |
| ビルド | electron-vite |
| エージェント実行 | `claude -p --output-format stream-json` |

## ディレクトリ構成

```
virtual-coding/
├── electron/
│   ├── main.ts          # Electronメインプロセス
│   ├── agentManager.ts  # claude -p プロセス管理・NDJSON解析
│   ├── ipc.ts           # IPCハンドラー
│   ├── preload.ts       # contextBridge API公開
│   └── projectStore.ts  # プロジェクト設定の永続化
├── src/
│   ├── components/      # Reactコンポーネント
│   ├── hooks/           # useAgent（IPC通信hooks）
│   ├── store/           # Zustandストア
│   └── types/           # 型定義
├── electron.vite.config.ts
└── package.json
```
