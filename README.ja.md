# Beautichunk

難読化されたJavaScriptファイルを、機能を維持したまま読みやすいチャンク化されたモジュールに変換します。

## 概要

Beautichunkは、TypeScriptベースのツールで、圧縮または難読化されたJavaScriptコードを：
- ✨ 可読性向上のためにコードを整形
- 📦 大きなファイルを管理しやすいチャンクに分割
- 🔗 実行順序と依存関係を保持
- 🎭 ブラウザとNode.js環境の両方をサポート
- 🚀 各環境に適したローダーを生成

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

複数ファイルの処理：
```bash
beautichunk file1.js file2.js file3.js -o ./output
```

globパターンの使用：
```bash
beautichunk "src/**/*.js" -o ./output
```

#### オプション

- `-o, --output <dir>` - 出力ディレクトリ（必須）
- `--max-chunk-size <size>` - 最大チャンクサイズ（KB）（デフォルト: `256`）
- `--source-maps` - ソースマップを生成
- `--verbose` - 詳細ログを有効化
- `--strategy <type>` - チャンク化戦略: `aggressive`、`conservative`、または `auto`（デフォルト: `auto`）
- `--config <file>` - 設定ファイルのパス（デフォルト: `beautichunk.config.json`）
- `--node-entry` - チャンク化された出力用のNode.jsエントリーポイント（`index.js`）を生成
- `--indent-size <size>` - インデントサイズ（デフォルト: `2`）
- `--indent-char <char>` - インデント文字: `space` または `tab`（デフォルト: `space`）
- `--preserve-newlines` - 既存の改行を保持

### Node.jsエントリーポイント

`--node-entry`オプションを使用すると、Beautichunkは以下を行う`index.js`ファイルを生成します：
- すべてのチャンクを正しい順序で読み込み
- すべてのモジュールエクスポートを収集して再エクスポート
- オリジナルファイルと同じAPIを維持

```bash
# Node.jsモジュールを処理
beautichunk large-module.js -o ./output --node-entry

# オリジナルと同じようにチャンク化されたモジュールを実行
node ./output/index.js
```

### プログラマティックAPI

```typescript
import { Parser, Analyzer, Chunker, Beautifier, Generator } from 'beautichunk';

// JavaScriptコードを解析
const parser = new Parser();
const ast = parser.parse(code);

// 依存関係を分析
const analyzer = new Analyzer();
const analysis = analyzer.analyze(ast);

// チャンクに分割
const chunker = new Chunker({
  strategy: 'auto',
  maxChunkSize: 256 * 1024
});
const chunks = chunker.chunk(ast, analysis);

// コードを整形
const beautifier = new Beautifier({
  indentSize: 2,
  indentChar: ' '
});
const beautifiedChunks = chunks.map(chunk => beautifier.beautifyChunk(chunk));

// 出力ファイルを生成
const generator = new Generator({
  outputDir: './output',
  generateSourceMaps: true,
  generateNodeEntry: true
});
await generator.generate(beautifiedChunks);
```

## 設定

`beautichunk.config.json`ファイルを作成：

```json
{
  "maxChunkSize": 262144,
  "strategy": "conservative",
  "sourceMaps": true,
  "nodeEntry": true,
  "beautifyOptions": {
    "indentSize": 2,
    "indentChar": " ",
    "preserveNewlines": true
  }
}
```

設定オプション：
- `maxChunkSize` - 最大チャンクサイズ（バイト）（デフォルト: `262144` = 256KB）
- `strategy` - チャンク化戦略: `aggressive`、`conservative`、または `auto`
- `sourceMaps` - ソースマップを生成
- `nodeEntry` - Node.jsエントリーポイントを生成
- `beautifyOptions` - コードフォーマットオプション
  - `indentSize` - インデントのスペース/タブ数
  - `indentChar` - 使用する文字: `" "`（スペース）または `"\t"`（タブ）
  - `preserveNewlines` - 元の改行を保持

## 動作原理

1. **解析** - JavaScriptコードをAcornを使用して抽象構文木（AST）に解析
2. **分析** - Tarjanのアルゴリズムを使用して関数と変数間の依存関係をマッピング
3. **チャンク化** - サイズ制約と依存関係に基づいてコードを賢く分割
4. **整形** - js-beautifyを使用して各チャンクを読みやすく再フォーマット
5. **生成** - 個別のチャンクファイルと適切なローダーモジュールを作成
   - ブラウザ用: 非同期チャンク読み込みを備えた`loader.js`
   - Node.js用: 同期requireを備えた`index.js`

## チャンク化戦略

- **Aggressive** - より小さなチャンクを優先、関連コードが分割される可能性あり
- **Conservative** - 関連コードをまとめて保持、より大きなチャンクになる可能性あり
- **Auto** - チャンクサイズとコードの結合性のバランスを取る（推奨）

## 例

### ブラウザでの使用

入力（難読化済み）：
```javascript
(function(){var a=1,b=2;function c(){return a+b}console.log(c())})();
```

出力構造：
```
output/
├── chunk_000.js    # 変数宣言
├── chunk_001.js    # 関数定義
├── chunk_002.js    # 実行コード
├── loader.js       # ブラウザローダー
└── manifest.json   # チャンクメタデータ
```

HTMLでの使用：
```html
<script src="output/loader.js"></script>
```

### Node.jsでの使用

`--node-entry`を使用したNode.jsモジュールの場合：
```
output/
├── chunk_000.js    # コア機能
├── chunk_001.js    # 追加機能
├── index.js        # Node.jsエントリーポイント
└── manifest.json   # チャンクメタデータ
```

使用方法：
```javascript
// オリジナル: const lib = require('./large-module.js');
// チャンク化: const lib = require('./output/index.js');
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