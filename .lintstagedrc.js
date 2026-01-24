module.exports = {
  // Format TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],

  // Format JSON files
  '**/*.{json,jsonc}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],

  // Format Markdown files
  '**/*.md': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],

  // Format CSS/SCSS files
  '**/*.{css,scss}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],
};
