# JHS-Manager

Rustサーバーの運用を自動化するための管理ツールです。Node.js (TypeScript) で動作し、RCONを通じたプレイヤーへの通知と、Systemdを経由したサーバープロセスの制御を行います。

## 主な機能

* **定期再起動**: 毎日指定時間（デフォルト: 朝05:00）にサーバーを再起動します。
* **自動ワイプ**: 第1・第3金曜日の夜（デフォルト: 20:00）にフルワイプ（マップ + BP削除）とアップデートを自動実行します。
* **ワイプ日判定**: ワイプ当日の朝は再起動せず、夜のワイプまでサーバーを停止状態で待機させます。
* **RCON通知**: 再起動やワイプの1時間前から、ゲーム内チャットでカウントダウン通知を行います。
* **堅牢な設計**: TypeScriptによる型安全性と、PM2によるプロセス永続化を採用。

## 動作環境

* **OS**: Linux (Ubuntu/Debian 推奨)
* **Runtime**: Node.js v20以上
* **Process Manager**: PM2
* **Server**: Systemdで管理されているRustサーバー

## ディレクトリ構成

```text
/home/rustserver/manager/
├── .env                  
├── package.json
├── tsconfig.json
├── eslint.config.mjs     
├── .prettierrc           
└── src/
    ├── index.ts          
    ├── config.ts        
    └── services/
        ├── RconService.ts      
        ├── SchedulerService.ts
        └── ServerOperations.ts
```

## 導入手順

### 1. 必要なツールのインストール

ホストOSにてNode.jsとPM2をインストールします。

```bash
# Node.js (v20系) のインストール
curl -fsSL [https://deb.nodesource.com/setup_20.x](https://deb.nodesource.com/setup_20.x) | sudo -E bash -
sudo apt-get install -y nodejs git

# PM2 と TypeScript 実行環境のインストール
sudo npm install -g pm2 ts-node typescript
```

### 2. プロジェクトのクローンとセットアップ

リポジトリをクローンし、依存関係をインストールします。

```bash
# 展開したいディレクトリへ移動
cd <対象のディレクトリ>

# リポジトリをクローン (ディレクトリ名は manager とします)
git clone https://github.com/Nekonnection/JHS-Manager.git

# 依存パッケージのインストール
npm install
```

### 3. 環境変数の設定

`.env` ファイルを作成し、ご自身の環境に合わせて記述してください。

```bash
cp .env.example .env  # 必要であれば作成
nano .env
```

**.env の内容例:**

```ini
# Rustサーバーのインストールディレクトリ
SERVER_DIR=/home/rustserver/serverfiles

# サーバーID (server/<ID> フォルダ名)
SERVER_IDENTITY=my_server

# RCON接続情報
RCON_IP=127.0.0.1
RCON_PORT=28017
RCON_PASSWORD=your_rcon_password

# BPファイル名 (ワイプ時に削除対象となります)
BP_FILENAME=player.blueprints.5.db
```

### 4. ファイル権限の保護

セキュリティのため、管理ツール内のファイルは実行ユーザー以外が読み書きできないように設定します。

```bash
cd /home/rustserver
# ディレクトリの所有者を変更
sudo chown -R your_user_name:your_user_name manager

# 権限を700(所有者のみフルアクセス)に設定
sudo chmod -R 700
```

## 実行・運用

### ビルドと起動

PM2を使用してアプリケーションを起動・永続化します。

```bash
cd /home/rustserver/manager

# TypeScriptのビルド
npm run build

# PM2で起動
pm2 start dist/index.js --name "rust-manager"

# ログを確認して動作チェック
pm2 logs rust-manager
```

### 自動起動の設定

サーバー（OS）再起動時に、このツールも自動で立ち上がるように設定します。

```bash
pm2 startup
pm2 save
```

## 開発・メンテナンス

本プロジェクトは ESLint と Prettier を導入しています。コードを修正する際は以下のコマンドを使用してください。

```bash
# コードの整形 (Prettier)
npm run format

# 静的解析・チェック (ESLint)
npm run lint

# 開発モード起動 (ts-nodeによる直接実行)
npm run dev
```
