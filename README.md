# TSCachedTable

A virtual table manager written in TypeScript.

## Constructor

``` TypeScript
let virtualTable = new VirtualTable(model, parent, options?);
```

Where:

Parameters | Type | Description
:---------:|:----:|------------
`model` | `TableModel` |Instance of `TableModel` interface that provides table data.
`parent` | `HTMLElement` | HTML element that contains the table. The `parent` element must have explicit '`height` attribute value.
`options` | `any` | Optional parameters for the table.

## Options

Field | Description
:-----:|----------
`renderCache` | Number of rows to render. Default: `50`
`bufferSize` | Number of rows to cache at top and bottom of table. Default: `10`
`headerBackground` | Background color for the table header. Default: `lightgray`
