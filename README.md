# @metalsmith/table-of-contents

A metalsmith plugin to generate table of contents.

[![metalsmith: core plugin][metalsmith-badge]][metalsmith-url]
[![npm version][npm-badge]][npm-url]
[![ci: build][ci-badge]][ci-url]
[![code coverage][codecov-badge]][codecov-url]
[![license: MIT][license-badge]][license-url]

`@metalsmith/table-of-contents` generates tables of contents for all files with a `toc: true` key in their frontmatter, and attaches a table-of-contents tree to the file's metadata.

## Installation

NPM:

```bash
npm install @metalsmith/table-of-contents
```

Yarn:

```bash
yarn add @metalsmith/table-of-contents
```

## Usage

Add `@metalsmith/table-of-contents` to your metalsmith build:

```javascript
const metalsmith = require('metalsmith')
const toc = require('@metalsmith/table-of-contents')
const layouts = require('@metalsmith/layouts')

metalsmith(__dirname).use(toc()) // defaults
metalsmith(__dirname)
  .use(
    toc({
      // explicit defaults
      levels: [2, 3, 4, 5, 6],
      anchor: 'add',
      root: null
    })
  )
  .use(layouts()) // use layouts/in-place for custom HTML rendering
  .build()
```

Specify `toc: true` in the file's frontmatter:

```html
---
title: Hello World!
toc: true
---

<h2>First subtitle</h2>
<h2>Second subtitle</h2>
```

...which will be transformed in JS to:

```js
{
  title: 'Hello World',
  toc: {
    level: 1,
    items: [
      {
        level: 2,
        anchor: 'first-subtitle',
        items: []
      },
      {
        level: 2,
        anchor: 'second-subtitle',
        items: []
      },
    ]
  },
  contents: Buffer.from('....')
}
```

### Options

All options are optional.

- `levels`: (`number[]`) - specify an array of numbers from 1-6 (matching `h1-6` tags). Default is `[2,3,4,5,6]`
- `anchor`: (`'add'|'keep'|'overwrite'|Function`) - a strategy for handling heading ID's and anchor links:
  - `'add'` (default) will use existing id's, and add new id's to elements without id
  - `'keep'`: will only use existing id's
  - `'overwrite'`: will overwrite existing id's, and add new id's to elements without id
  - `Function`: you can specify a custom callback which gets the cheerio element as parameter, e.g. `($el) => $el.attr('id')`
- `root`: (`string`) - Optional root selector to search for headings. Useful if you want to target headings in a specific element, e.g. `article.main-content`.

### Rendering

By default `@metalsmith/table-of-contents` can be `toString()`ed in templates. Eg. with Handlebars you could just do `{{{ toc }}}`. If the templating language executes in a JS context (like underscore templates), you can simply call `toString`: `<%= toc.toString() %>`. This will render a default HTML like:

```html
<ol class="toc">
  <li class="toc-item">
    <a class="toc-link" href="#first-title">First title</a>
  </li>
</ol>
```

### Custom rendering

If you need to customize the rendered HTML, you can always use [`@metalsmith/layouts`](https://github.com/metalsmith/layouts) or [`@metalsmith/in-place`](https://github.com/metalsmith/in-place) with a custom template partial. Below is an example with an inline Handlebars partial:

```html
{{#*inline "renderToc" }}
<ol class="toc">
  {{#each .}}
  <li data-level="{{ level }}">
    <a href="#{{{ anchor }}}">{{ text }}</a>
    {{#if items.length }} {{> renderToc items }} {{/if}}
  </li>
  {{/each}}
</ol>
{{/inline}} {{> renderToc toc.items }}
```

For each TOC item you have access to the properties `text`,`anchor`,`level`,`items`,`parent`.

### Compatibility with `<a name="">` anchors

Sometimes you need to re-use existing `<a name="">` tags as anchors instead of the headings themselves (eg when using `@metalsmith/markdown` or a plugin like `jsdoc-to-md`. In that case you can use a custom function for the anchor option like so:

```js
metalsmith.use(
  tableOfContents({
    anchor($el) {
      const $anchor = $el.prev()
      return $anchor.length ? $anchor.attr('name') : null
    }
  })
)
```

### Debug

To enable debug logs, set the `DEBUG` environment variable to `@metalsmith/table-of-contents`:

Linux/Mac:

```
DEBUG=@metalsmith/table-of-contents
```

Windows:

```
set "DEBUG=@metalsmith/table-of-contents"
```

Alternatively you can set `DEBUG` to `@metalsmith/*` to debug all Metalsmith core plugins.

### CLI Usage

To use this plugin with the Metalsmith CLI, add `@metalsmith/table-of-contents` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "@metalsmith/table-of-contents": {
        "levels": [2, 3, 4, 5, 6],
        "anchor": "add",
        "root": null
      }
    }
  ]
}
```

### Caveat

According to the HTML specification a `<section><h1>Title</h1></section>` will be recognized as a `<h2>`. This plugin does not take section roots into account, so you should explicitly use `h1-h6` tags.

## Credits

Credit goes to [anatoo](https://github.com/anatoo) for creating the original [metalsmith-autotoc](https://github.com/anatoo/metalsmith-autotoc.git), on which this plugin is based.

## License

[MIT](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/@metalsmith/table-of-contents.svg
[npm-url]: https://www.npmjs.com/package/@metalsmith/table-of-contents
[ci-badge]: https://app.travis-ci.com/github/metalsmith/table-of-contents.svg?branch=master
[ci-url]: https://app.travis-ci.com/github/metalsmith/table-of-contents
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: http://metalsmith.io
[codecov-badge]: https://img.shields.io/coveralls/github/metalsmith/table-of-contents
[codecov-url]: https://coveralls.io/github/metalsmith/table-of-contents
[license-badge]: https://img.shields.io/github/license/metalsmith/table-of-contents
[license-url]: LICENSE
