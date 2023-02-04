<p align="center">
  <img
    style="object: contain; height: 150px"
    src="https://raw.githubusercontent.com/glhrmoura/imports-sorter/main/src/images/icon.png"
  />
</p>

# Imports Sorter

Extension for Visual Studio Code that helps organize imports by sorting them based on their source folder.

## Classification rules

The extension uses a block-based classification system. In order, the blocks are:

### Core

Block dedicated to the core libraries of the project.

**Examples:** react, vue, react native.

### Libraries

Block dedicated to third-party libraries.

**Examples:** redux, vuex, enzyme, styled-components.

### General

Block dedicated to the general (non-component) imports of the project.

**Examples:** services, constants, helpers.

### Global components

Block dedicated to imported global components, which are acquired from the project root.

**Examples:** ~/components, @/components.

### Local components

Block dedicated to imported local components, which are acquired from a folder at the same level as the requesting file.

**Example:** ./components.

## Overview

<p align="center">
  <img src="https://github.com/glhrmoura/imports-sorter/raw/main/src/docs/overview.gif" />
</p>

## License

[MIT](https://github.com/glhrmoura/imports-sorter/blob/main/LICENSE)

Copyright (c) Guilherme Moura
