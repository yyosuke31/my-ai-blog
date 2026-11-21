import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI();
const title = process.env.ISSUE_TITLE || 'テスト記事';
const promptText = process.env.ISSUE_BODY || 'このテーマについて簡潔に解説してください。';

async function generateWithRetry(prompt) {
  // 現在稼働中の現役モデルリスト（上から順に試行）
  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
  ];

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`${modelName} で生成を試行中 (${attempt}回目)...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        return response.text;
      } catch (error) {
        const status = error.status || '';
        console.warn(`エラー発生 (${modelName} - ${attempt}回目):`, status, error.message);

        // 404（モデル廃止・未対応）の場合は待たずに即座に次のモデルへ
        if (status === 404 || String(error.message).includes('404')) {
          break;
        }

        // 503（混雑）などの場合は5秒だけ待って再試行
        if (attempt < 2) {
          await new Promise((res) => setTimeout(res, 5000));
        }
      }
    }
  }
  throw new Error('すべてのモデルで記事生成に失敗しました。');
}

async function run() {
  const prompt = `
以下のテーマでブログ記事をMarkdown形式で書いてください。
タイトル: ${title}
補足: ${promptText}

※注意: 最初の行に必ず以下のフロントマター（メタデータ）を含め、コードブロック(\`\`\`)では囲まないでください。
---
title: "${title}"
description: "${title}についての解説記事です。"
pubDate: "${new Date().toISOString().split('T')}"
---
`;

  const generatedText = await generateWithRetry(prompt);

  const fileName = `post-${Date.now()}.md`;
  const filePath = path.join('src/content/blog', fileName);

  fs.writeFileSync(filePath, generatedText);
  console.log(`記事を生成しました: ${filePath}`);
}

run();
