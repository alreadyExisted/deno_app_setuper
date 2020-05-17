# Deno App Setuper

A CLI to setup apps like a [Create React App](https://github.com/facebook/create-react-app).

## Installation

```bash
deno install \
  --unstable \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-run \
  -f -n das \
  https://raw.githubusercontent.com/alreadyExisted/deno_app_setuper/master/cli.ts
```

If after install show message:

```bash
ℹ️ Add /Users/<user>/.deno/bin to PATH
  export PATH="/Users/<user>/.deno/bin:$PATH"
```

Add deno to paths

```bash
export PATH="/Users/<user>/.deno/bin:$PATH"
```

## Usage

By default used last version of [https://github.com/alreadyExisted/das-react-template](https://github.com/alreadyExisted/das-react-template)

```bash
das dashboard-app
```

For custome template use arg `--template <:owner/:repo>`

```bash
das dashboard-app --template alreadyExisted/das-vue-template
```
