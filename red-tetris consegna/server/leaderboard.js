import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FILE_PATH = path.join(__dirname, 'scores.json')

function readScores() {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]))
    return []
  }

  const raw = fs.readFileSync(FILE_PATH, 'utf-8')
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveScore(newScore) {
  const scores = readScores()

  scores.push(newScore)
  const top10 = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  fs.writeFileSync(FILE_PATH, JSON.stringify(top10, null, 2))

  return top10
}

export { readScores, saveScore }
