import { bold, gray, green, red, yellow } from 'fmt/mod.ts'
import { parse, Args as _Args } from 'flags/mod.ts'
import { readZip } from 'zip/mod.ts'

const DEFAULT_REPO = 'alreadyExisted/das-react-template'
const DEFAULT_BRANCH_NAME = 'master'

interface Args extends _Args {
  template?: string
}

async function cli(): Promise<void> {
  const args = parse(Deno.args) as Args
  const applicationName = (args._[0] || DEFAULT_BRANCH_NAME) as string

  console.log(bold(`Creating a new app in ${green(`${Deno.cwd()}/${applicationName}`)}`))
  console.log()

  const fullRepoName = args.template || DEFAULT_REPO
  const versionName = await getLastVersionNameTemplate(fullRepoName)

  const [, repoName] = fullRepoName.split('/')
  const archiveFileName =
    versionName === DEFAULT_BRANCH_NAME ? DEFAULT_BRANCH_NAME : `${repoName}-${versionName.slice(1)}`
  await getTemplateArchive(fullRepoName, versionName, archiveFileName)

  await unzipTemplateArchive(archiveFileName, applicationName)

  await installDependencies(applicationName)

  console.log()
  console.log(bold(green('Success 🤖🤖🤖!!!')))
}

if (import.meta.main) {
  cli()
}

async function getLastVersionNameTemplate(repoName: string) {
  console.log(`${gray('[1/6]')} 🔍 Get last version name template...`)
  try {
    const response = await fetch(`https://api.github.com/repos/${repoName}/tags`)
    const [{ name }] = (await response.json()) as { name: string }[]
    console.log(`${green('success')} Last version name template is ${yellow(name)}...`)
    return name
  } catch {
    console.log(`${red('fail')} Last version name template not found...`)
    console.log(`Used ${yellow('master')} by default...`)
    return 'master'
  }
}

async function getTemplateArchive(fullRepoName: string, versionName: string, archiveFileName: string) {
  console.log(`${gray('[2/6]')} 🚚 Fetching template archive...`)
  try {
    const response = await fetch(`https://github.com/${fullRepoName}/archive/${versionName}.zip`)
    const body = new Uint8Array(await response.arrayBuffer())
    await Deno.writeFile(`${archiveFileName}.zip`, body)
    console.log(`${green('success')} ${yellow(`${archiveFileName}.zip`)} downloaded...`)
  } catch {
    console.log(`${red('fail')} Fetching template archive...`)
    Deno.exit()
  }
}

async function unzipTemplateArchive(archiveFileName: string, applicationName: string) {
  console.log(`${gray('[3/6]')} 📤 Unzip template...`)
  const _fileName = `${archiveFileName}.zip`
  const zip = await readZip(_fileName)
  await zip.unzip()
  console.log(`${green('success')} ${yellow(_fileName)} unziped...`)
  console.log(`${gray('[4/6]')} ✍️ Renaming template...`)
  await Deno.rename(archiveFileName, applicationName)
  console.log(`${green('success')} ${yellow(archiveFileName)} renamed to ${yellow(applicationName)}...`)
  console.log(`${gray('[5/6]')} 🗑 Removing archive template...`)
  await Deno.remove(_fileName)
  console.log(`${green('success')} ${yellow(_fileName)} removed...`)
}

async function installDependencies(applicationName: string) {
  console.log(`${gray('[6/6]')} 💿 Install dependencies...`)
  let isYarn
  try {
    await Deno.stat(`${applicationName}/yarn.lock`)
    isYarn = true
  } catch {
    isYarn = false
  }
  const p = Deno.run({
    cmd: [isYarn ? 'yarn' : 'npm', 'install'],
    cwd: applicationName
  })
  console.log(await p.status())
  console.log(`${green('success')} Dependencies installed...`)
}
