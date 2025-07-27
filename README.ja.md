# Beautichunk

難読化されたJavaScriptファイルを、機能を維持したまま読みやすいチャンク化されたモジュールに変換します。

## 概要

Beautichunkは、TypeScriptベースのツールで、圧縮または難読化されたJavaScriptコードを：
- ✨ 可読性向上のためにコードを整形
- 📦 大きなファイルを管理しやすいチャンク（< 256KB）に分割
- 🔗 実行順序と依存関係を保持
- 🚀 シームレスな統合のためのローダーを生成

## インストール

```bash
npm install -g beautichunk
```

またはプロジェクト内でローカルに使用：

```bash
npm install beautichunk
```

## 使用方法

### コマンドライン

```bash
beautichunk input.js -o ./output
```

#### オプション

- `-o, --output <dir>` - 出力ディレクトリ（デフォルト: `./output`）
- `-s, --max-size <size>` - 最大チャンクサイズ（KB）（デフォルト: `256`）
- `-m, --source-maps` - ソースマップを生成
- `-v, --verbose` - 詳細ログを有効化
- `--strategy <type>` - チャンク化戦略: `aggressive`、`conservative`、または `auto`（デフォルト: `auto`）
- `-c, --config <file>` - 設定ファイルのパス

### プログラマティックAPI

```typescript
import { Beautichunk } from 'beautichunk';

const beautichunk = new Beautichunk({
  input: 'obfuscated.js',
  output: './output',
  maxChunkSize: 256 * 1024,
  generateSourceMaps: true,
  strategy: 'auto'
});

await beautichunk.process();
```

## 設定

`beautichunk.config.json`ファイルを作成：

```json
{
  "input": "src/obfuscated.js",
  "output": "dist/chunks",
  "maxChunkSize": 262144,
  "beautifyOptions": {
    "indent_size": 2,
    "preserve_newlines": true
  },
  "strategy": "conservative",
  "generateSourceMaps": true
}
```

## 動作原理

1. **解析** - 難読化されたJavaScriptを抽象構文木（AST）に解析
2. **整形** - 設定可能なルールを使用してコードを読みやすく再フォーマット
3. **分析** - コードセクション間の依存関係をマッピング
4. **チャンク化** - サイズ制約と依存関係に基づいてコードを賢く分割
5. **生成** - 個別のチャンクファイルとローダーモジュールを作成

## チャンク化戦略

- **Aggressive** - より小さなチャンクを優先、関連コードが分割される可能性あり
- **Conservative** - 関連コードをまとめて保持、より大きなチャンクになる可能性あり
- **Auto** - チャンクサイズとコードの結合性のバランスを取る（推奨）

## 例

入力（難読化済み）：
```javascript
(function(){var a=1,b=2;function c(){return a+b}console.log(c())})();
```

出力構造：
```
output/
├── chunk-0.js
├── chunk-1.js
├── loader.js
└── manifest.json
```

## 開発

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/beautichunk.git

# 依存関係をインストール
npm install

# プロジェクトをビルド
npm run build

# テストを実行
npm test

# 開発モードで実行
npm run dev
```

## 貢献

貢献は歓迎します！PRを提出する前に、貢献ガイドラインをお読みください。

## ライセンス

MIT