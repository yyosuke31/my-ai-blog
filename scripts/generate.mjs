import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI();
const title = process.env.ISSUE_TITLE || 'テスト記事';
const promptText = process.env.ISSUE_BODY || 'このテーマについて簡潔に解説してください。';

async function generateWithRetry(prompt) {
  const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`${modelName} で生成を試行中 (${attempt}回目)...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        return response.text;
      } catch (error) {
        console.warn(`エラー発生 (${modelName} - ${attempt}回目):`, error.status || error.message);
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, 10000 * attempt));
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
pubDate: "${new Date().toISOString().split('T')[0]}"
---
`;

  const generatedText = await generateWithRetry(prompt);

  const fileName = `post-${Date.now()}.md`;
  const filePath = path.join('src/content/blog', fileName);

  fs.writeFileSync(filePath, generatedText);
  console.log(`記事を生成しました: ${filePath}`);
}

run();
