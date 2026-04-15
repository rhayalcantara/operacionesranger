/**
 * Script to add WithAudio wrapper to all composition files.
 * Wraps the outermost AbsoluteFill with <WithAudio audioFile="XX-Name.mp3">
 */
const fs = require('fs');
const path = require('path');

const COMP_DIR = path.join(__dirname, 'src', 'compositions');

const files = fs.readdirSync(COMP_DIR).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(COMP_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract the number-name prefix (e.g., "01-Login" from "01-Login.tsx")
  const baseName = file.replace('.tsx', '');
  const audioFile = `${baseName}.mp3`;

  // Skip if already has WithAudio
  if (content.includes('WithAudio')) {
    console.log(`SKIP: ${file} (already has WithAudio)`);
    continue;
  }

  // Add WithAudio to imports
  if (content.includes('from "../templates"')) {
    content = content.replace(
      /from "\.\.\/templates"/,
      'from "../templates"'
    );
    // Add WithAudio to the import if it uses destructured imports
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*"\.\.\/templates"/,
      (match, imports) => {
        if (!imports.includes('WithAudio')) {
          return `import { ${imports.trim()}, WithAudio } from "../templates"`;
        }
        return match;
      }
    );
  }

  // Wrap the return content: find the first <AbsoluteFill and wrap with WithAudio
  // Strategy: Add <WithAudio> right after the return (
  content = content.replace(
    /return\s*\(\s*<AbsoluteFill/,
    `return (\n    <WithAudio audioFile="${audioFile}">\n    <AbsoluteFill`
  );

  // Find the closing of the component: last </AbsoluteFill> before );
  // Add </WithAudio> before the last );
  const lastClosingIndex = content.lastIndexOf('</AbsoluteFill>');
  if (lastClosingIndex !== -1) {
    const afterClosing = content.substring(lastClosingIndex + '</AbsoluteFill>'.length);
    const beforeClosing = content.substring(0, lastClosingIndex + '</AbsoluteFill>'.length);
    content = beforeClosing + '\n    </WithAudio>' + afterClosing;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`OK: ${file} -> ${audioFile}`);
}

console.log('\nDone! All compositions now have audio.');
