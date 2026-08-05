import { readdir, mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const categories = ['sound', 'image', 'text', 'number']
const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])
const outputPath = resolve(root, 'src/data/generatedGameImages.ts')
const images = []
const ids = new Map()

for (const category of categories) {
  const folder = resolve(root, 'public/assets/images', category)
  let entries = []

  try {
    entries = await readdir(folder, { withFileTypes: true })
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  const files = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && supportedExtensions.has(extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'))

  console.log(`[image-manifest] ${category}: ${files.length}개`)
  if (files.length !== 10) {
    console.warn(`[image-manifest] 경고: ${category} 폴더에는 10장이 필요하지만 ${files.length}장이 있습니다.`)
  }

  for (const filename of files) {
    const stem = filename.slice(0, -extname(filename).length)
    const safeStem = stem.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
    const id = `${category}-${safeStem || 'image'}`
    if (ids.has(id)) {
      throw new Error(`중복 이미지 ID "${id}": ${ids.get(id)} 및 ${category}/${filename}. 파일명을 고유하게 변경해 주세요.`)
    }
    ids.set(id, `${category}/${filename}`)
    images.push({ id, category, src: `/assets/images/${category}/${encodeURIComponent(filename)}`, alt: '' })
  }
}

const rows = images.map(({ id, category, src }) =>
  `  { id: ${JSON.stringify(id)}, category: ${JSON.stringify(category)}, src: ${JSON.stringify(src)}, alt: "" },`,
)
const content = `/* 이 파일은 scripts/generate-image-manifest.mjs가 자동 생성합니다. 직접 수정하지 마세요. */\nimport type { GameImage } from '../types/game'\n\nexport const generatedGameImages: GameImage[] = [\n${rows.join('\n')}\n]\n`

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, content, 'utf8')
console.log(`[image-manifest] ${relative(root, outputPath)}에 총 ${images.length}장을 등록했습니다.`)
