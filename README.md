hyshare
=========

Share galleries and files from [Hydrus](https://hydrusnetwork.github.io/hydrus/) on the web

[![Version](https://img.shields.io/npm/v/hyshare.svg)](https://npmjs.org/package/hyshare)
[![Downloads/week](https://img.shields.io/npm/dw/hyshare.svg)](https://npmjs.org/package/hyshare)
[![License](https://img.shields.io/npm/l/hyshare.svg)](https://github.com/floogulinc/hyshare/blob/master/package.json)

hyshare allows you to share galleries of files from hydrus using tags and individual files using just a link. It communicates to the Hydrus client using it's API. 

To share a gallery with hyshare. Set a tag on all the files you want to share using the prefix/namespace you have configured (by default `hyshare:`). Whatever is after the prefix will become the path to the gallery. For example if you used a tag `hyshare:demo`, the gallery would be at `<your hyshare url>/gallery/demo`.

To share individual files, simply copy the SHA256 hash from Hydrus and append it to this path `<your hyshare url>/view/`. For example, `<your hyshare url>/view/ad6d3599a6c489a575eb19c026face97a9cd6579e74728b0ce94a601d232f3c3`.


## Installation

### NPM
```sh-session
$ npm install -g hyshare
```
(run again to update)

### Docker
A Docker image is published [here](https://github.com/floogulinc/hyshare/pkgs/container/hyshare)

### Running from source
```sh-session
$ npm install
```

## Running the server

You will need your API key and potentially your API URL configured in an environment variable ([see below](#environment-config)) before running the server.

### NPM
```sh-session
$ hyshare
```

### Docker
```sh-session
$ docker run -p 3000:3000 ghcr.io/floogulinc/hyshare
```

### From source
```sh-session
# development
$ npm run tailwind:build
$ npm run start

# watch mode
$ npm run tailwind:dev
$ npm run start:dev

# production mode
$ npm run tailwind:build
$ npm run start:prod
```

## Configuration

hyshare has two sets of configuration items. The environment config and app config. You will need to restart hyshare for any changes to apply.

### Environment Config

The environment config is loaded from environment variables and optionally a `.env` file (using [dotenv](https://www.npmjs.com/package/dotenv)). It looks in the current working directory for this `.env` file.

Here are all the environment config items (they are optional unless stated otherwise):

| Config Item | Default Value | Description |
|----|----|----|
| `HYSHARE_PORT` | `3000` | The port to serve hyshare on. |
| `HYSHARE_HYDRUS_API_URL` | `http://localhost:45869/` | The URL to your Hydrus client API. |
| `HYSHARE_HYDRUS_API_KEY` |  | (**required**) an access key for the Hydrus API. It should have the "search for files" permission enabled. |
| `HYSHARE_HYDRUS_API_TIMEOUT` | `30000` | The timeout in ms hyshare will wait for requests to the Hydrus API. A value of `0` disables the timeout. |
| `HYSHARE_LOG_REQUESTS` | `false` | Whether hyshare should log each request to the console. If `true` hyshare will use [morgan](https://www.npmjs.com/package/morgan) to log every request. |
| `HYSHARE_REQUEST_LOG_FORMAT` | `common` | The morgan format to use for logged requests. See the list of [pre-defined formats](https://www.npmjs.com/package/morgan#predefined-formats) or create your own with the default [tokens](https://www.npmjs.com/package/morgan#tokens) |
| `HYSHARE_CACHE_TTL` | `60` | The length of time in minutes hyshare should cache responses. |
| `HYSHARE_BASE_URL` |  | The base URL hyshare is served on. Used for twitter embed meta tags that require an absolute URL. |
| `HYSHARE_THUMBNAIL_DIR` |  | The absolute directory where Hydrus thumbnails are stored. Providing this will allow hyshare to serve thumbnails directly from disk where possible instead of going through the Hydrus API. This directory should be the one containing `t00` through `tff` subdirectories with the thumbnails inside them. By default this would be the `client_files` directory in the `db` directory in a regular Hydrus install. |
| `NODE_ENV` | `production` | (development only) The environment type hyshare is running in (set to `development` to have nunjucks watch for changes to the templates). |


### App Config

The app config is loaded from a JSON, YAML, or JS file using [cosmicconfig](https://github.com/davidtheclark/cosmiconfig). It looks for a file called `.hyshare.json` (could also be `.yml` for example) starting in the current working directory and moving up until it hits your home directory. This means you can put `.hyshare.json` in your home folder.

Here are the app config items (they are all optional):

| Config Item | Default Value | Description |
|----|----|----|
| `searchTags` | `[]` | An array of tags to add to each gallery search. Refer to [the Hydrus docs](https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_search_files) for what can be used here. |
| `searchPrefix` | `hyshare:` | The prefix to add to the requested gallery name. For example by default when `/gallery/test` is requested, hyshare will search Hydrus for `hyshare:test`. This can be blank, which will simply search verbatim for the tag `/gallery/{tag}`. |
| `hiddenTags` | `[]` | An array of tags to hide in the file view. |
| `hiddenNamespaces` | `["hyshare"]` | An array of namespaces to hide in the file view. |
| `tagServiceToSearch` | | The tag service name to use for the gallery search. By default this searches all tag services. It is recommended to use a tag service that is not a public tag repo (eg the PTR) and is not effected by public tag repo siblings and parents. If the tag service used can be effected by PTR parents or siblings someone could potentially sibling or parent a `hyshare:` tag to something else and expose your files. |
| `tagServicesToDisplay` | `["all known tags"]` | An array of tag service names to display in the file view |
| `showNotes` | `true` | A boolean indicating whether to show notes on the file view |
| `showUrls` | `true` | A boolean indicating whether to show known URLs on the file view |
| `urlTypesToDisplay` | `[0, 3, 4]` | An array of integers indicating which types of URLs to display in the file view. See [the Hydrus docs](https://hydrusnetwork.github.io/hydrus/developer_api.html#add_urls_get_url_info) for a list of URL types. |
| `hiddenUrlClassNames` | `[]` | An array of Hydrus URL class names that will be hidden from the file view. |
| `embedTitle` | `true` | A boolean indicating whether to include the title of the file in embed metadata tags (for example for Discord embeds) |
| `titleFromNamespace` | `true` | A boolean indicating whether to try to determine a title for the file from the first tag with a title namespace, configured below. If this is `false` or no title tag is found it falls back to "Image File" for example. |
| `titleNamespace` | `title` | The namespace to use to determine a file's title. |
| `fullThumbs` | `false` | A boolean indicating whether to show full thumbnails in the gallery view. If set to `false` thumbnails will be cropped in to fill the entire square. |
| `noRounded` | `false` | A boolean indicating whether to disable rounded corners on various UI elements including thumbnails and buttons. |
| `blackDarkTheme` | `false` | A boolean indicating whether to use a more pure-black dark theme. |
| `defaultSortType` |  | An integer indicating which sort type to use in the gallery view. Refer to [the Hydrus docs](https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_search_files) for a list of valid sort types |
| `defaultSortAsc` |  | A boolean indicating whether to use an ascending order for sorting in the gallery view. `true` results in ascending order, `false` results in descending order. |
| `blockedHashes` | `[]` | An array of SHA256 hashes that will be blocked from galleries, the file view, thumbnail, and file requests. |
| `redirects` | `{}` | A JSON object of paths to URLs for custom redirects. Only one one level of path is supported (eg no `/`s). For example `{ "test": "https://example.com" }` will produce a redirect from `/test` to `https://example.com`. Relative URLs are also supported for the redirect target. |

## Running as a service

There are many ways to run hyshare as a service. [PM2](https://pm2.keymetrics.io/) for example may work. I will share the steps for what I use personally on Windows.

### Windows with WinSW

1. Install `hyshare` with NPM ([see above](#installation)).
2. Create a `hyshare` folder somewhere. I put this in my user folder. You can put your `.env` file and `.hyshare.json` file here for config.
3. Download [WinSW](https://github.com/winsw/winsw/releases/latest), rename the exe to `hyshare-service.exe` and put it in your `hyshare` folder.
4. Find where your hyshare script is by running `get-command hyshare` in PowerShell. You should get something like `C:\Users\floogulinc\AppData\Roaming\npm\hyshare.ps1` in the result.
5. Create a file called `hyshare-service.xml` in your `hyshare` folder. Using the below template, replace the `<executable>` entry with what you found in the previous step, replacing `.ps1` with `.cmd`.
    ```xml
    <service>
      <id>hyshare</id>
      <!-- Display name of the service -->
      <name>hyshare</name>
      <!-- Service description -->
      <description>hyshare server</description>
      <executable>C:\Users\floogulinc\AppData\Roaming\npm\hyshare.cmd</executable>
      <arguments>run</arguments>
      <log mode="roll-by-time">
        <pattern>yyyy-MM-dd</pattern>
      </log>
    </service>
    ``` 
6. Open a PowerShell window in your `hyshare` directory and run `.\hyshare-service.exe install`. That should install the service. You can open `services.msc` to check and start it if it's not already started.

## Reverse Proxy and HTTPS

You will probably want to expose your hyshare server to the internet. It is recommended to use a reverse proxy to serve hyshare over HTTPS. There are many options for this so here are some potential ways to do it.

### Caddy and port forwarding

If you are comfortable port forwarding to the machine you run hyshare on you can easily setup Caddy with automatic HTTPS.

For users who have already [setup Caddy, Duck DNS, and Tailscale](https://github.com/floogulinc/hydrus-web/wiki/Accessing-the-Hydrus-API-with-Caddy,-Duck-DNS,-and-Tailscale) for Hydrus Web, skip to step 3, appending the config to your existing `Caddyfile` using a new subdomain from DuckDNS or somewhere else. 

1. Download [Caddy](https://caddyserver.com/)
2. Setup Caddy to run as a service using [these instructions](https://caddyserver.com/docs/running).
3. Create your `Caddyfile` in the directory you created in the last step:
    ```
    https://YOUR_DOMAIN {
      reverse_proxy localhost:3000
      tls YOUR_EMAIL
      encode zstd gzip
    }
    ```
    Replace `YOUR_DOMAIN` with some domain that points at your public IP address. This can be a free subdomain from somewhere like [Duck DNS](https://www.duckdns.org/). Replace `YOUR_EMAIL` with your email address.
4. Reload Caddy or restart the service.

### Private share with Caddy and Tailscale

If you would like to share files securely with only a few people you can all use Tailscale to have a private connection between your computers. You can largely follow the [existing guide for use with Hydrus Web](https://github.com/floogulinc/hydrus-web/wiki/Accessing-the-Hydrus-API-with-Caddy,-Duck-DNS,-and-Tailscale) and substitute `localhost:45869` with `localhost:3000` or whatever port hyshare is running on.

Another option will be using Caddy 2.5 which is currently in beta. Caddy 2.5 will allow you to skip using DuckDNS or otherwise and directly obtain a HTTPS certificate from Tailscale.

Finally, you can even just serve hyshare over HTTP if using Tailscale since Tailscale is already encrypting the data. Simple have Tailscale and hyshare running and your other devices and those you have shared your machine with on Tailscale will be able to access hyshare directly.

### Cloudflare Tunnel

This is what I personally use. It allows you to share your hyshare server with the internet without port forwarding. This works by having the Cloudflare daemon running on your machine which will receive any requests to the Cloudflare domain/subdomain you have pointed to it. This will require you have a domain set up with Cloudflare. 

I suggest following their documentation for [running as a service](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/run-tunnel/as-a-service/).

As an example, my `config.yml` file looks like:
```yaml
tunnel: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: C:\Windows\System32\config\systemprofile\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: hyshare.XXXXXXXXX.com
    service: http://localhost:3000
  - service: http_status:404
logfile:  C:\Cloudflared\cloudflared.log
```
