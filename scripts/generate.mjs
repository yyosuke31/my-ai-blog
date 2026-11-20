import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI();
const title = process.env.ISSUE_TITLE || 'テスト記事';
const promptText = process.env.ISSUE_BODY || 'このテーマについて簡潔に解説してください。';

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

  const response = await ai.models.generateContent({
   model: 'gemini-3.8-flash',
    contents: prompt,
  });

  const fileName = `post-${Date.now()}.md`;
  const filePath = path.join('src/content/blog', fileName);

  fs.writeFileSync(filePath, response.text);
  console.log(`記事を生成しました: ${filePath}`);
}

run();
