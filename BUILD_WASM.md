# Installation

## Prerequisites (Mac):

```sh
brew install emscripten
brew install rust
brew install ccache
```

## Modify submodule duckdb

```sh
cd submodules/duckdb
git apply ../../duckdb.patch
cd ../..
```

## Building wasm files

```sh
mkdir build
make build/bootstrap
DUCKDB_EXCEL=1 DUCKDB_JSON=1 DUCKDB_DATADOCS=1 make wasm
make js_release
```

## Location wasm file

```
packages/duckdb-wasm/dist
```
