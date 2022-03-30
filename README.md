hyshare
=========

Share galleries and files from Hydrus on the web

[![Version](https://img.shields.io/npm/v/hyshare.svg)](https://npmjs.org/package/hyshare)
[![Downloads/week](https://img.shields.io/npm/dw/hyshare.svg)](https://npmjs.org/package/hyshare)
[![License](https://img.shields.io/npm/l/hyshare.svg)](https://github.com/floogulinc/hyshare/blob/master/package.json)


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Configuration

hyshare has two sets of configuration items. The environment config and app config.

### Environment Config

The environment config is loaded from environment variables and optionally a `.env` file (using [dotenv](https://www.npmjs.com/package/dotenv)).

Here are all the environment config items (they are optional unless stated otherwise):

| Config Item | Default Value | Description |
|----|----|----|
| `HYSHARE_PORT` | `3000` | The port to serve hyshare on. |
| `HYSHARE_HYDRUS_API_URL` | `http://localhost:45869/` | The URL to your Hydrus client API. |
| `HYSHARE_HYDRUS_API_KEY` |  | (**required**) an access key for the Hydrus API. It should have the "search for files" permission enabled. |
| `HYSHARE_LOG_REQUESTS` | `false` | Whether hyshare should log each request to the console. |
| `HYSHARE_CACHE_TTL` | `60` | The length of time in minutes hyshare should cache responses. |
| `HYSHARE_BASE_URL` |  | The base URL hyshare is served on. Used for twitter embed meta tags that require an absolute URL. |
| `NODE_ENV` | `production` | (development only) The environment type hyshare is running in (set to `development` to have nunjucks watch for changes to the templates). |

### App Config

The app config is loaded from a JSON, YAML, or JS file using [cosmicconfig](https://github.com/davidtheclark/cosmiconfig). It looks for a file called `.hyshare.json` (could also be `.yml` for example) starting in the hyshare project directory and moving up until it hits your home directory. This means you can put `.hyshare.json` in your home folder.

Here are the app config items (they are all optional):

| Config Item | Default Value | Description |
|----|----|----|
| `searchTags` | `[]` | An array of tags to add to each gallery search. Refer to the [Hydrus API docs](https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_search_files) for what can be used here. |
| `searchPrefix` | `hyshare:` | The prefix to add to the requested gallery name. For example by default when `/gallery/test` is requested, hyshare will search Hydrus for `hyshare:test`. This can be blank, which will simply search verbatim for the tag `/gallery/{tag}`. |
| `hiddenTags` | `[]` | An array of tags to hide in the file view. |
| `hiddenNamespaces` | `["hyshare"]` | An array of namespaces to hide in the file view. |
| `tagServiceToSearch` | | The tag service name to use for the gallery search. By default this searches all tag services. It is recommended to use a tag service that is not a public tag repo (eg the PTR) and is not effected by public tag repo siblings and parents. If the tag service used can be effected by PTR parents or siblings someone could potentially sibling or parent a `hyshare:` tag to something else and expose your files. |
| `tagServicesToDisplay` | `["all known tags"]` | An array of tag service names to display in the file view |
| `showNotes` | `true` | A boolean indicating whether to show notes on the file view |
| `showUrls` | `true` | A boolean indicating whether to show known URLs on the file view |
| `urlTypesToDisplay` | `[0, 3, 4]` | An array of integers indicating which types of URLs to display in the file view. See [the Hydrus docs](https://hydrusnetwork.github.io/hydrus/developer_api.html#add_urls_get_url_info) for a list of URL types. |
| `embedTitle` | `true` | A boolean indicating whether to include the title of the file in embed metadata tags (for example for Discord embeds) |
| `titleFromNamespace` | `true` | A boolean indicating whether to try to determine a title for the file from the first tag with a title namespace, configured below. If this is `false` or no title tag is found it falls back to "Image File" for example. |
| `titleNamespace` | `title` | The namespace to use to determine a file's title. |
| `fullThumbs` | `false` | A boolean indicating whether to show full thumbnails in the gallery view. If set to `false` thumbnails will be cropped in to fill the entire square. |
| `noRounded` | `false` | A boolean indicating whether to disable rounded corners on various UI elements including thumbnails and buttons. |
| `blackDarkTheme` | `false` | A boolean indicating whether to use a more pure-black dark theme. |