import { bold, gray, green, red, yellow } from 'https://deno.land/x/std@0.59.0/fmt/colors.ts'
import { parse, Args as _Args } from 'https://deno.land/x/std@0.59.0/flags/mod.ts'
import { join } from 'https://deno.land/std@v0.59.0/path/mod.ts'
import { readZip } from 'https://deno.land/x/jszip/mod.ts'

const DEFAULT_REPO = 'alreadyExisted/das-react-template'
const DEFAULT_BRANCH_NAME = 'master'

interface Args extends _Args {
  template?: string
}

async function cli(): Promise<void> {
  const args = parse(Deno.args) as Args
  const applicationName = (args._[0] || DEFAULT_BRANCH_NAME) as string

  console.log(bold(`Creating a new app in ${green(join(Deno.cwd(), applicationName))}`))
  console.log()

  const fullRepoName = args.template || DEFAULT_REPO
  const versionName = await getLastVersionNameTemplate(fullRepoName)

  const [, repoName] = fullRepoName.split('/')
  const archiveFileName =
    versionName === DEFAULT_BRANCH_NAME ? DEFAULT_BRANCH_NAME : `${repoName}-${versionName.slice(1)}`
  await getTemplateArchive(fullRepoName, versionName, archiveFileName)

  await unzipTemplateArchive(archiveFileName, applicationName)

  await fetchGitConfigs(fullRepoName, versionName, applicationName)

  await installDependencies(applicationName)

  console.log()
  console.log(bold(`Success 🤖🤖🤖!!! Created app at ${green(join(Deno.cwd(), applicationName))}`))
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

async function fetchGitConfigs(fullRepoName: string, versionName: string, applicationName: string) {
  console.log(`${gray('[6/7]')} 🚚 Fetching .gitignore and .gitattributes...`)
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${fullRepoName}/${versionName}/.gitignore`)
    const body = new Uint8Array(await response.arrayBuffer())
    await Deno.writeFile(join(applicationName, '.gitignore'), body)
    console.log(`${green('success')} ${yellow(`.gitignore`)} downloaded...`)
  } catch {
    console.log(`${red('fail')} Fetching .gitignore...`)
  }
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${fullRepoName}/${versionName}/.gitattributes`)
    const body = new Uint8Array(await response.arrayBuffer())
    await Deno.writeFile(join(applicationName, '.gitattributes'), body)
    console.log(`${green('success')} ${yellow(`.gitattributes`)} downloaded...`)
  } catch {
    console.log(`${red('fail')} Fetching .gitattributes...`)
  }
}

async function installDependencies(applicationName: string) {
  console.log(`${gray('[7/7]')} 💿 Install dependencies...`)
  let isYarn
  try {
    await Deno.stat(join(applicationName, 'yarn.lock'))
    isYarn = true
  } catch {
    isYarn = false
  }
  await exec(['git', 'init'], applicationName)
  console.log(`${green('success')} Initialized git repo...`)
  const packageManager = isYarn ? 'yarn' : 'npm'
  const nativeTerminalArgs = Deno.build.os === 'windows' ? ['cmd', '/c'] : []
  await exec([...nativeTerminalArgs, packageManager, 'install'], applicationName)
  console.log(`${green('success')} Dependencies installed...`)
  await exec(['git', 'add', '.'], applicationName)
  await exec(['git', 'commit', '-m', 'Init repo'], applicationName)
}

async function exec(args: string[], cwd: string) {
  const proc = await Deno.run({ cmd: args, cwd }).status()

  if (proc.success == false) {
    Deno.exit(proc.code)
  }

  return proc
}
